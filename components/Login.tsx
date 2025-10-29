import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Pill, LogIn, User, KeyRound } from 'lucide-react';

const Login: React.FC = () => {
  const { state, dispatch } = useInventory();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const user = state.users.find(u => u.username === username && u.password === password);

    if (user) {
      dispatch({ type: 'LOGIN', payload: { username, password_hash: password } });
    } else {
      setError('اسم المستخدم أو كلمة المرور غير صحيحة.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Pill className="text-teal-600" size={40} />
            <h1 className="text-3xl font-bold text-teal-600 mr-2">صيدليتي</h1>
          </div>
          <p className="text-gray-600">
            أهلاً بك! يرجى تسجيل الدخول للمتابعة.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <User className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="اسم المستخدم"
              required
              className="w-full border border-gray-300 rounded-lg shadow-sm py-2 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          <div className="relative">
             <KeyRound className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="كلمة المرور"
              required
              className="w-full border border-gray-300 rounded-lg shadow-sm py-2 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <div>
            <button
              type="submit"
              className="w-full bg-teal-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
            >
              <LogIn size={20} />
              <span>تسجيل الدخول</span>
            </button>
          </div>
        </form>
         <div className="text-center text-sm text-gray-500 pt-4 border-t">
            <p>مستخدم افتراضي:</p>
            <p>اسم المستخدم: <span className="font-mono">admin</span></p>
            <p>كلمة المرور: <span className="font-mono">admin</span></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
