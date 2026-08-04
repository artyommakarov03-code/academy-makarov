import { useEffect, useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function TesterGreeting() {
  const [greeting, setGreeting] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadGreeting(session) {
      const user = session?.user;
      if (!user) {
        if (mounted) setGreeting(null);
        return;
      }
      const storageKey = `new-knowledge-greeting:${user.id}`;
      if (sessionStorage.getItem(storageKey) === 'shown') return;

      const { data } = await supabase
        .from('tester_greetings')
        .select('id,title,message')
        .eq('user_id', user.id)
        .eq('active', true)
        .maybeSingle();

      if (mounted && data) setGreeting({ ...data, storageKey });
    }

    supabase.auth.getSession().then(({ data }) => loadGreeting(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => loadGreeting(session));
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  function close() {
    if (greeting?.storageKey) sessionStorage.setItem(greeting.storageKey, 'shown');
    setGreeting(null);
  }

  if (!greeting) return null;

  return (
    <div className="tester-greeting-backdrop" onMouseDown={close}>
      <section className="tester-greeting" onMouseDown={(event) => event.stopPropagation()}>
        <button className="tester-greeting-close" onClick={close} aria-label="Закрыть"><X /></button>
        <div className="tester-greeting-icon"><Sparkles /></div>
        <span>Закрытое тестирование</span>
        <h2>{greeting.title}</h2>
        <p>{greeting.message}</p>
        <button className="primary wide" onClick={close}>Начать тестирование</button>
      </section>
    </div>
  );
}
