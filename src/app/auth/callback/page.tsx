'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState('Confirming your email…');

  useEffect(() => {
    let active = true;
    let redirected = false;
    const goHome = () => {
      if (!active || redirected) return;
      redirected = true;
      setMessage('Email confirmed. Redirecting to Campus OS…');
      window.location.replace('/');
    };

    const params = new URLSearchParams(window.location.search);
    const authError = params.get('error_description') || params.get('error');
    if (authError) {
      setMessage(decodeURIComponent(authError.replace(/\+/g, ' ')));
      return () => { active = false; };
    }

    const subscription = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED')) goHome();
    });

    const finish = async () => {
      const code = params.get('code');
      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          if (active) setMessage(error.message);
          return;
        }
        if (data.session) goHome();
        return;
      }
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        if (active) setMessage(error.message);
        return;
      }
      if (data.session) goHome();
      else if (active) setMessage('Confirmation link expired or already used. Please sign in or request a new confirmation email.');
    };

    void finish();
    return () => {
      active = false;
      subscription.data.subscription.unsubscribe();
    };
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-6">
      <section className="w-full max-w-md rounded-2xl border border-white/15 bg-white/5 p-6 text-center space-y-4">
        <h1 className="text-2xl font-bold">Campus OS email confirmation</h1>
        <p className="text-sm text-slate-300 break-words">{message}</p>
        <Link href="/auth/login" className="inline-flex rounded-xl bg-purple-600 px-5 py-3 font-semibold hover:bg-purple-500">Go to sign in</Link>
      </section>
    </main>
  );
}
