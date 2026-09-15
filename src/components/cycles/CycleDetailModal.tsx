import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Users, MessageSquare, Share2, LogOut, Plus, Shield, Check } from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { Avatar } from '../common/Avatar';

export const CycleDetailModal: React.FC = () => {
  const {
    activeCycleId,
    setActiveCycleId,
    cycles,
    toggleJoinCycle,
    sendCycleMessage,
    triggerShareToast,
  } = useLalao();

  const [activeTab, setActiveTab] = useState<'chat' | 'members'>('chat');
  const [inputText, setInputText] = useState('');
  const [invited, setInvited] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeCycleId) {
      containerRef.current?.scrollTo({ top: 0, behavior: 'instant' });
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [activeCycleId]);

  if (!activeCycleId) return null;

  const cycle = cycles.find((c) => c.id === activeCycleId);
  if (!cycle) return null;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendCycleMessage(cycle.id, inputText.trim());
    setInputText('');
  };

  const handleInvite = () => {
    setInvited(true);
    triggerShareToast(`Invite link for ${cycle.name} copied to clipboard!`);
    setTimeout(() => setInvited(false), 2000);
  };

  return (
    <div
      ref={containerRef}
      id="cycle-detail-screen"
      className="absolute inset-0 z-40 bg-white flex flex-col min-h-full overflow-hidden animate-in fade-in slide-in-from-right-4 duration-250"
    >
      <div className="w-full flex-1 flex flex-col bg-white overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setActiveCycleId(null)}
              className="p-1.5 -ml-1 rounded-full text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 transition-colors cursor-pointer"
              title="Back"
            >
              <X className="w-5 h-5 stroke-[2.2]" />
            </button>
            <Avatar src={cycle?.user?.avatar || cycle?.avatar} alt={cycle?.name || 'Cycle'} size="md" />
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-neutral-900 truncate">{cycle?.name}</h3>
              <p className="text-xs text-neutral-500 truncate">
                {cycle?.memberCount} members · {cycle?.location}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleInvite}
              className="p-2 rounded-full text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
              title="Invite people"
            >
              {invited ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Action / Member Bar */}
        <div className="px-4 py-2.5 bg-neutral-50 border-b border-neutral-100 flex items-center justify-between shrink-0">
          {/* Sub-tabs: Chat vs Members */}
          <div className="flex items-center gap-1 bg-neutral-200/60 p-0.5 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-1 px-3 py-1 rounded-md transition-all ${
                activeTab === 'chat' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Chat
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`flex items-center gap-1 px-3 py-1 rounded-md transition-all ${
                activeTab === 'members' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Members ({cycle.memberCount})
            </button>
          </div>

          {/* Join / Leave toggle button */}
          <button
            onClick={() => toggleJoinCycle(cycle.id)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              cycle.isMember
                ? 'text-rose-600 hover:bg-rose-50 border border-rose-200'
                : 'bg-[#5E43F3] text-white hover:bg-[#4E34E0]'
            }`}
          >
            {cycle.isMember ? (
              <>
                <LogOut className="w-3 h-3" />
                Leave Cycle
              </>
            ) : (
              <>
                <Plus className="w-3 h-3" />
                Join Cycle
              </>
            )}
          </button>
        </div>

        {/* Content area */}
        {activeTab === 'chat' ? (
          <div className="flex-1 flex flex-col min-h-0 bg-neutral-50/50">
            {/* Cycle description banner */}
            <div className="p-3 bg-indigo-50/50 border-b border-indigo-100/60 text-xs text-neutral-600">
              <span className="font-bold text-neutral-800">Cycle Mission:</span> {cycle.description}
            </div>

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cycle.messages.length > 0 ? (
                cycle.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 ${
                      msg.isMine ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    {!msg.isMine && (
                      <Avatar src={msg.senderAvatar} alt={msg.senderName} size="xs" />
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                        msg.isMine
                          ? 'bg-[#5E43F3] text-white rounded-br-xs'
                          : 'bg-white text-neutral-900 border border-neutral-100 shadow-xs rounded-bl-xs'
                      }`}
                    >
                      {!msg.isMine && (
                        <p className="font-bold text-[10px] text-neutral-500 mb-0.5">
                          {msg.senderName}
                        </p>
                      )}
                      <p>{msg.text}</p>
                      <p
                        className={`text-[9px] mt-1 text-right ${
                          msg.isMine ? 'text-indigo-200' : 'text-neutral-400'
                        }`}
                      >
                        {msg.timestamp}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-400 space-y-2">
                  <MessageSquare className="w-8 h-8 text-neutral-300" />
                  <p className="text-xs font-semibold">No messages in this Cycle yet</p>
                  <p className="text-[11px] text-neutral-500">
                    Be the first to post a thought, update, or request to the group!
                  </p>
                </div>
              )}
            </div>

            {/* Input Form */}
            {cycle.isMember ? (
              <form
                onSubmit={handleSendMessage}
                className="p-3 bg-white border-t border-neutral-100 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Message ${cycle.name}...`}
                  className="flex-1 px-4 py-2.5 rounded-full bg-neutral-100 hover:bg-neutral-200/50 focus:bg-white focus:ring-2 focus:ring-[#5E43F3]/20 focus:border-[#5E43F3] border border-transparent text-xs text-neutral-900 placeholder:text-neutral-400 outline-none"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className={`p-2.5 rounded-full transition-all ${
                    inputText.trim()
                      ? 'bg-[#5E43F3] text-white hover:bg-[#4E34E0] shadow-sm'
                      : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <div className="p-3 bg-neutral-100 border-t border-neutral-200 text-center">
                <button
                  onClick={() => toggleJoinCycle(cycle.id)}
                  className="text-xs font-bold text-[#5E43F3] hover:underline"
                >
                  Join this Cycle to participate and send messages
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Members Tab */
          <div className="flex-1 overflow-y-auto p-4 divide-y divide-neutral-100">
            {cycle.members && cycle.members.map((member) => (
              <div key={member.id} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Avatar src={member?.avatar} alt={member?.name || 'Member'} size="sm" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-neutral-900">{member?.name}</span>
                      {member.role === 'admin' && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-indigo-50 text-[#5E43F3] border border-indigo-100">
                          <Shield className="w-2.5 h-2.5" />
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-400">@{member.username}</p>
                  </div>
                </div>

                <span className="text-[11px] text-neutral-500">{member.location}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
