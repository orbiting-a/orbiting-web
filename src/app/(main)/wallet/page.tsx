"use client";

import { useState } from "react";
import { useAccount, useConnect, useDisconnect, useBalance, useSendTransaction } from "wagmi";
import { injected } from "wagmi/connectors";
import { Card, Button, Input } from "@/components/ui";
import {
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  Copy,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { formatEther, parseEther } from "viem";

export default function WalletPage() {
  const { address, isConnected, chain } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balance, refetch: refetchBalance } = useBalance({ address });
  const { sendTransactionAsync } = useSendTransaction();

  const [showSend, setShowSend] = useState(false);
  const [sendTo, setSendTo] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [sending, setSending] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const connectMetaMask = () => connect({ connector: injected() });

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setTxError(null);
    setTxHash(null);
    if (!sendTo || !sendAmount) return;

    try {
      setSending(true);
      const hash = await sendTransactionAsync({
        to: sendTo as `0x${string}`,
        value: parseEther(sendAmount),
      });
      setTxHash(hash);
      setSendTo("");
      setSendAmount("");
      refetchBalance();
    } catch (err: any) {
      setTxError(err?.message || "Transaction failed");
    } finally {
      setSending(false);
    }
  };

  const formatAddr = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Wallet</h1>
        <p className="text-sm text-text-secondary">Manage assets and rewards earned from challenges</p>
      </div>

      {!isConnected ? (
        <Card className="flex flex-col items-center justify-center text-center py-12">
          <div className="h-16 w-16 rounded-full bg-brand-400/10 flex items-center justify-center mb-4">
            <Wallet className="h-8 w-8 text-brand-400" />
          </div>
          <h2 className="font-bold text-lg mb-1">Connect Web3 Wallet</h2>
          <p className="text-sm text-text-muted max-w-xs mb-6">
            Connect your wallet to manage tokens, view NFTs, and redeem orbit rewards.
          </p>
          <Button onClick={connectMetaMask} variant="primary" className="w-full max-w-xs font-bold">
            Connect MetaMask
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Connected wallet info */}
          <Card padding="md" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-400/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary">
                {address ? formatAddr(address) : "Connected"}
              </p>
              <p className="text-xs text-text-muted">{chain?.name || "Ethereum"}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleCopy} icon={<Copy className="h-4 w-4" />}>
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => disconnect()}>
              Disconnect
            </Button>
          </Card>

          {/* Balance card */}
          <Card className="bg-gradient-to-br from-[#20222f] to-[#170F27] border-brand-400/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <span className="text-[10px] uppercase font-bold text-brand-400 bg-brand-400/10 px-2 py-0.5 rounded-full">
                {chain?.name || "Network"}
              </span>
            </div>
            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Available Balance</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white">
                {balance ? formatEther(balance.value).slice(0, 8) : "0.00"}
              </span>
              <span className="text-sm font-semibold text-brand-400">{balance?.symbol || "ETH"}</span>
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                icon={<ArrowUpRight className="h-4 w-4" />}
                onClick={() => setShowSend(!showSend)}
              >
                Send
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                icon={<ArrowDownLeft className="h-4 w-4" />}
                onClick={handleCopy}
              >
                Receive
              </Button>
            </div>
          </Card>

          {/* Send form */}
          {showSend && (
            <Card className="space-y-4">
              <h3 className="text-sm font-bold text-text-primary">Send {balance?.symbol || "ETH"}</h3>
              <form onSubmit={handleSend} className="space-y-3">
                <Input
                  placeholder="Recipient address (0x...)"
                  value={sendTo}
                  onChange={(e) => setSendTo(e.target.value)}
                  required
                />
                <Input
                  type="number"
                  step="0.0001"
                  placeholder="Amount"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  required
                />
                {txHash && (
                  <div className="flex items-center gap-2 text-xs text-green-400">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Sent! Tx: {formatAddr(txHash)}</span>
                  </div>
                )}
                {txError && (
                  <div className="flex items-center gap-2 text-xs text-red-400">
                    <AlertCircle className="h-3 w-3" />
                    <span className="truncate">{txError}</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowSend(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" className="flex-1" loading={sending}>
                    {sending ? "Sending..." : "Send"}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Collectibles */}
          <div>
            <h3 className="font-bold text-sm text-text-muted uppercase tracking-wider mb-3">Your Collectibles</h3>
            <div className="grid grid-cols-2 gap-3">
              <Card hover className="p-3 flex flex-col justify-between h-36">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center text-lg">
                  🥇
                </div>
                <div>
                  <h4 className="font-bold text-xs">First Orbit Pioneer</h4>
                  <p className="text-[10px] text-text-muted">Issued June 2026</p>
                </div>
              </Card>
              <Card hover className="p-3 flex flex-col justify-between h-36">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#FF8D23] to-[#F9FF54] flex items-center justify-center text-lg">
                  🏆
                </div>
                <div>
                  <h4 className="font-bold text-xs">Treasure Hunter</h4>
                  <p className="text-[10px] text-text-muted">Completed 3 challenges</p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
