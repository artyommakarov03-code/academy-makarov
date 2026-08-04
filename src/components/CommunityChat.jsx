import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Crown,
  MessageCircle,
  Reply,
  Send,
  ShieldCheck,
  Trash2,
  UserRound,
  Users
} from 'lucide-react';
import { avatarPublicUrl } from '../lib/profileMedia';
import { supabase } from '../lib/supabase';

function formatTime(value) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

export default function CommunityChat({ user, profile, isDemo }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef(null);

  const messagesById = useMemo(
    () => Object.fromEntries(messages.map((message) => [message.id, message])),
    [messages]
  );

  async function loadMessages() {
    if (!user || isDemo) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const { data, error: loadError } = await supabase
      .from('community_messages')
      .select(`
        id,
        user_id,
        content,
        reply_to,
        created_at,
        edited_at,
        author:community_profiles!community_messages_user_id_fkey(
          nickname,
          avatar_path,
          tester_tier,
          updated_at
        )
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(120);

    setLoading(false);
    if (loadError) {
      setError(loadError.message);
      return;
    }
    setMessages((data || []).reverse());
  }

  useEffect(() => {
    loadMessages();
    if (!user || isDemo) return undefined;

    let timer;
    const channel = supabase
      .channel('new-knowledge-community-chat')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'community_messages' },
        () => {
          clearTimeout(timer);
          timer = setTimeout(loadMessages, 120);
        }
      )
      .subscribe();

    return () => {
      clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [user?.id, isDemo]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function sendMessage() {
    const content = text.trim();
    if (!user || isDemo || sending || !content) return;
    if (content.length > 1000) {
      setError('Сообщение не должно превышать 1000 символов.');
      return;
    }

    setSending(true);
    setError('');
    const { error: sendError } = await supabase.from('community_messages').insert({
      user_id: user.id,
      content,
      reply_to: replyTo?.id || null
    });
    setSending(false);

    if (sendError) {
      setError(sendError.message);
      return;
    }
    setText('');
    setReplyTo(null);
    await loadMessages();
  }

  async function removeMessage(message) {
    if (!user || isDemo) return;
    const canRemove = message.user_id === user.id || profile.role === 'owner';
    if (!canRemove) return;
    const { error: removeError } = await supabase
      .from('community_messages')
      .update({ deleted_at: new Date().toISOString(), deleted_by: user.id })
      .eq('id', message.id);
    if (removeError) setError(removeError.message);
  }

  if (isDemo) {
    return (
      <div className="page-stack">
        <section className="chat-locked-card">
          <Users />
          <h1>Общий чат доступен зарегистрированным пользователям</h1>
          <p>В демонстрационном режиме сообщения не отправляются и персональные данные не создаются.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="page-stack community-chat-page">
      <header className="page-header chat-page-header">
        <div>
          <span className="page-eyebrow">Сообщество «Новых Знаний»</span>
          <h1>Общий чат пользователей</h1>
          <p>Обсуждайте уроки, делитесь подходами и помогайте друг другу. Никнейм, аватар и статус видны всем участникам чата.</p>
        </div>
        <div className="chat-member-status"><Crown /><div><b>Золотой тестер</b><span>{profile.nickname || profile.display_name}</span></div></div>
      </header>

      <section className="chat-layout">
        <aside className="chat-rules-card">
          <div className="section-heading"><div><span>Правила</span><h2>Уважительный разговор</h2></div><ShieldCheck /></div>
          <p>Обсуждайте идеи и решения, а не личные качества участников. Не публикуйте телефоны, адреса, пароли и другие чувствительные данные.</p>
          <ul>
            <li>Пишите по теме обучения и развития проекта.</li>
            <li>Критику сопровождайте конкретным предложением.</li>
            <li>Не отправляйте одно сообщение чаще чем раз в две секунды.</li>
            <li>Владелец может удалить сообщения, нарушающие правила.</li>
          </ul>
          <div className="chat-privacy-note"><Users /><span>Возраст и учебные настройки других участников в чат не передаются.</span></div>
        </aside>

        <section className="chat-panel">
          <div className="chat-panel-head">
            <div><MessageCircle /><span><b>Общий канал</b><small>{messages.length} последних сообщений</small></span></div>
            <i className="chat-live-dot" title="Обновления в реальном времени" />
          </div>

          <div className="chat-messages" aria-live="polite">
            {loading && <div className="chat-empty">Загружаю сообщения…</div>}
            {!loading && !messages.length && (
              <div className="chat-empty"><MessageCircle /><b>Чат пока пуст</b><span>Начните первое обсуждение.</span></div>
            )}

            {messages.map((message) => {
              const author = Array.isArray(message.author) ? message.author[0] : message.author;
              const own = message.user_id === user?.id;
              const quoted = message.reply_to ? messagesById[message.reply_to] : null;
              const quotedAuthor = Array.isArray(quoted?.author) ? quoted.author[0] : quoted?.author;
              const avatar = avatarPublicUrl(author?.avatar_path, author?.updated_at);
              const canRemove = own || profile.role === 'owner';

              return (
                <article key={message.id} className={`chat-message ${own ? 'own' : ''}`}>
                  <div className="chat-avatar">
                    {avatar ? <img src={avatar} alt="" /> : <UserRound />}
                  </div>
                  <div className="chat-message-body">
                    <div className="chat-message-meta">
                      <span><b>{author?.nickname || 'Участник'}</b><i><Crown /> Золотой тестер</i></span>
                      <time>{formatTime(message.created_at)}</time>
                    </div>
                    {quoted && (
                      <div className="chat-quote">
                        <b>{quotedAuthor?.nickname || 'Участник'}</b>
                        <span>{quoted.content.slice(0, 140)}</span>
                      </div>
                    )}
                    <p>{message.content}</p>
                    <div className="chat-message-actions">
                      <button type="button" onClick={() => setReplyTo(message)}><Reply /> Ответить</button>
                      {canRemove && <button type="button" onClick={() => removeMessage(message)}><Trash2 /> Удалить</button>}
                    </div>
                  </div>
                </article>
              );
            })}
            <div ref={endRef} />
          </div>

          <div className="chat-composer">
            {replyTo && (
              <div className="reply-preview">
                <Reply />
                <div><b>Ответ пользователю</b><span>{replyTo.content.slice(0, 120)}</span></div>
                <button onClick={() => setReplyTo(null)}>×</button>
              </div>
            )}
            <textarea
              value={text}
              maxLength={1000}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Напишите сообщение… Enter — отправить, Shift+Enter — новая строка"
            />
            <div className="chat-composer-actions">
              <span>{text.length}/1000</span>
              <button className="primary" disabled={sending || !text.trim()} onClick={sendMessage}>
                <Send /> {sending ? 'Отправляю…' : 'Отправить'}
              </button>
            </div>
            {error && <div className="form-message error">{error}</div>}
          </div>
        </section>
      </section>
    </div>
  );
}
