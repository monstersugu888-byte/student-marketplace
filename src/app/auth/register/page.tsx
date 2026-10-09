'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { GraduationCap, Mail, Lock, User, BookOpen, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { login, updateProfile } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [major, setMajor] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;

    login(email, password);
    if (name) {
      updateProfile({ name, major: major || 'Computer Science' });
    }
    router.push('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-tr from-purple-900 via-slate-900 to-indigo-950 text-white">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-heading font-extrabold tracking-tight">
            Create Student Account
          </h1>
          <p className="text-xs text-purple-200">
            Join CampusMate and organize your academic life
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-purple-200 mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-300" />
              <input
                type="text"
                required
                placeholder="Alex Rivera"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 focus:border-purple-400 rounded-xl text-white placeholder-purple-300/50 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-purple-200 mb-1">
              Campus Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-300" />
              <input
                type="email"
                required
                placeholder="student@campus.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 focus:border-purple-400 rounded-xl text-white placeholder-purple-300/50 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-purple-200 mb-1">
              Course / Major
            </label>
            <div className="relative">
              <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-300" />
              <input
                type="text"
                placeholder="Computer Science B.Tech"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 focus:border-purple-400 rounded-xl text-white placeholder-purple-300/50 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-purple-200 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-300" />
              <input
                type="password"
                required
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 focus:border-purple-400 rounded-xl text-white placeholder-purple-300/50 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 mt-4"
          >
            <span>Create Account</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-purple-200 pt-2">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-bold text-white hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
