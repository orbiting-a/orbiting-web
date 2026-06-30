"use client";

import { use, useState, useEffect } from "react";
import { Card, Avatar, Button, Input } from "@/components/ui";
import { Map, Trophy, ArrowLeft, Users, CheckCircle2, XCircle, Loader2, Lightbulb, Star } from "lucide-react";
import Link from "next/link";
import { getTreasureHunt, getRiddles, startTreasureHunt, getMyProgress, submitRiddleAnswer, getTreasureHuntLeaderboard } from "@/lib/supabase/queries";
import type { TreasureHunt, Profile, Riddle, TreasureHuntParticipant } from "@/types/database";

function TreasureHuntDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [hunt, setHunt] = useState<(TreasureHunt & { profiles: Profile }) | null>(null);
  const [riddles, setRiddles] = useState<Riddle[]>([]);
  const [progress, setProgress] = useState<TreasureHuntParticipant | null>(null);
  const [leaderboard, setLeaderboard] = useState<(TreasureHuntParticipant & { profiles: Profile })[]>([]);
  const [activeTab, setActiveTab] = useState("play");
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<{ correct: boolean } | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      const [h, r, p, lb] = await Promise.all([
        getTreasureHunt(id),
        getRiddles(id),
        getMyProgress(id),
        getTreasureHuntLeaderboard(id),
      ]);
      setHunt(h as (TreasureHunt & { profiles: Profile }) | null);
      setRiddles(r);
      setProgress(p);
      setStarted(!!p);
      setLeaderboard(lb as (TreasureHuntParticipant & { profiles: Profile })[]);
      setLoading(false);
    }
    load();
  }, [id]);

  const handleStart = async () => {
    const p = await startTreasureHunt(id);
    if (p) { setProgress(p); setStarted(true); }
  };

  const currentRiddle = riddles.find((r) => r.level === (progress?.current_level || 1));

  const handleSubmitAnswer = async () => {
    if (!currentRiddle) return;
    setSubmitting(true);
    const res = await submitRiddleAnswer(currentRiddle.id, answer);
    setResult(res);
    if (res.correct) {
      setTimeout(async () => {
        const p = await getMyProgress(id);
        if (p) setProgress(p);
        setAnswer("");
        setResult(null);
        setShowHint(false);
        const lb = await getTreasureHuntLeaderboard(id);
        setLeaderboard(lb as (TreasureHuntParticipant & { profiles: Profile })[]);
      }, 1500);
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-400" />
      </div>
    );
  }

  if (!hunt) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-text-primary mb-2">Treasure hunt not found</h2>
        <Link href="/treasure-hunts" className="text-brand-400 hover:underline text-sm">Back to Treasure Hunts</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link href="/treasure-hunts" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Treasure Hunts
      </Link>

      <Card padding="lg" className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center">
            <Map className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{hunt.name}</h1>
            <p className="text-xs text-text-muted">{riddles.length} riddles · {hunt.participant_count} participants</p>
          </div>
        </div>
        {hunt.description && <p className="text-sm text-text-secondary mb-4">{hunt.description}</p>}
        {hunt.profiles && (
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Avatar name={hunt.profiles.display_name || "U"} size="sm" src={hunt.profiles.avatar_url} />
            <span>Created by {hunt.profiles.display_name || hunt.profiles.username}</span>
          </div>
        )}
      </Card>

      <div className="flex border-b border-border mb-6">
        {["play", "leaderboard"].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${
              activeTab === tab ? "border-brand-400 text-brand-400" : "border-transparent text-text-muted hover:text-text-secondary"
            }`}
          >
            {tab === "play" ? (started ? "Play" : "Start") : tab}
          </button>
        ))}
      </div>

      {activeTab === "play" && (
        <div className="space-y-4">
          {!started ? (
            <Card padding="lg" className="text-center py-12">
              <Trophy className="h-10 w-10 text-brand-400 mx-auto mb-3" />
              <h3 className="font-bold text-text-primary mb-1">Ready for the adventure?</h3>
              <p className="text-sm text-text-muted mb-6">Solve riddles, find locations, earn points</p>
              <Button variant="primary" onClick={handleStart}>Start Hunt</Button>
            </Card>
          ) : progress?.completed ? (
            <Card padding="lg" className="text-center py-12">
              <CheckCircle2 className="h-10 w-10 text-green-400 mx-auto mb-3" />
              <h3 className="font-bold text-text-primary mb-1">Hunt Complete!</h3>
              <p className="text-sm text-text-muted">Final score: {progress.score} points</p>
            </Card>
          ) : currentRiddle ? (
            <Card padding="lg">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-text-muted">Riddle {currentRiddle.level} of {riddles.length}</span>
                <span className="text-xs text-brand-400 font-medium">{progress?.score || 0} points</span>
              </div>

              <p className="text-text-primary font-medium mb-2">{currentRiddle.content}</p>

              {currentRiddle.hint && (
                <div className="mb-4">
                  <button onClick={() => setShowHint(!showHint)} className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300">
                    <Lightbulb className="h-3 w-3" /> {showHint ? "Hide hint" : "Show hint"}
                  </button>
                  {showHint && <p className="text-xs text-text-muted mt-1">{currentRiddle.hint}</p>}
                </div>
              )}

              {currentRiddle.answer_type === "code" ? (
                <div className="space-y-3">
                  <Input placeholder="Your answer..." value={answer} onChange={(e) => setAnswer(e.target.value)} />
                  <Button variant="primary" onClick={handleSubmitAnswer} loading={submitting} disabled={!answer.trim()}>
                    Submit Answer
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-text-muted">Visit the location to unlock this riddle</p>
              )}

              {result && (
                <div className={`flex items-center gap-2 mt-3 text-sm ${result.correct ? "text-green-400" : "text-red-400"}`}>
                  {result.correct ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  <span>{result.correct ? "Correct! +" + currentRiddle.max_score + " points" : "Wrong answer, try again"}</span>
                </div>
              )}
            </Card>
          ) : null}
        </div>
      )}

      {activeTab === "leaderboard" && (
        <div className="space-y-2">
          {leaderboard.length === 0 ? (
            <Card padding="lg" className="text-center py-12">
              <Users className="h-10 w-10 text-text-muted mx-auto mb-3" />
              <p className="text-sm text-text-muted">No participants yet</p>
            </Card>
          ) : (
            leaderboard.map((entry, i) => (
              <Card key={entry.id} padding="md" className="flex items-center gap-3">
                <span className={`w-6 text-center text-sm font-bold ${i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-400" : i === 2 ? "text-orange-400" : "text-text-muted"}`}>
                  {i + 1}
                </span>
                <Avatar name={entry.profiles?.display_name || "U"} size="sm" src={entry.profiles?.avatar_url} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{entry.profiles?.display_name || entry.profiles?.username}</p>
                  <p className="text-xs text-text-muted">Level {entry.current_level}{entry.completed ? " · Completed" : ""}</p>
                </div>
                <div className="flex items-center gap-1 text-sm font-bold text-brand-400">
                  <Star className="h-3 w-3" /> {entry.score}
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function TreasureHuntPage({ params }: { params: Promise<{ id: string }> }) {
  return <TreasureHuntDetail params={params} />;
}
