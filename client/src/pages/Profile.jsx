import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import API_BASE_URL, { BASE_URL } from '../api/config';
import { AuthContext } from '../context/AuthContext';
import { 
  Upload, 
  User, 
  Shield, 
  Mail, 
  Lock, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function Profile() {
  const { user, updateUser } = useContext(AuthContext);
  const [profile, setProfile] = useState({ name: '', email: '', role: '', avatarUrl: '' });
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState(null); // 'success', 'error'
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/users/profile.php`);
      if (res.data.status === 'success') {
        setProfile(res.data.data);
      }
    } catch (e) { console.error('Failed to load profile'); }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`${API_BASE_URL}/users/profile.php`, {
        name: profile.name,
        password: password
      });
      setMessage(res.data.message);
      setStatus('success');
      setPassword('');
      setTimeout(() => setStatus(null), 3000);
    } catch (e) {
      setMessage('Update failed. Check your data.');
      setStatus('error');
    }
  };

  const handleAvatarUpload = async (selectedFile) => {
    if (!selectedFile) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('avatar', selectedFile);

    try {
      const res = await axios.post(`${API_BASE_URL}/users/upload_avatar.php`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const newAvatarUrl = res.data.avatarUrl;
      setProfile(prev => ({ ...prev, avatarUrl: newAvatarUrl }));
      updateUser({ avatarUrl: newAvatarUrl });
      
      setMessage('Avatar successfully synchronized!');
      setStatus('success');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Avatar upload failed');
      setStatus('error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="flex flex-col md:flex-row items-center gap-8 mb-16 pb-12 border-b border-white/5">
         <div className="relative group">
            {profile.avatarUrl ? (
              <div className="relative">
                <img src={`${BASE_URL}/${profile.avatarUrl}?t=${Date.now()}`} alt="avatar" className={`w-32 h-32 rounded-3xl object-cover ring-4 ring-indigo-500/20 shadow-2xl transition-all group-hover:ring-indigo-500/50 ${isUploading ? 'opacity-40 grayscale-[0.5]' : ''}`} />
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-32 h-32 rounded-3xl bg-indigo-600 flex items-center justify-center text-4xl font-bold text-white shadow-2xl ring-4 ring-indigo-500/20">
                {isUploading ? (
                  <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  profile.name?.charAt(0)
                )}
              </div>
            )}
            <form className="absolute -bottom-2 -right-2">
               <label htmlFor="avatar-upload" className={`w-10 h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center cursor-pointer shadow-lg transition-all active:scale-90 border border-white/10 ${isUploading ? 'pointer-events-none opacity-50' : ''}`}>
                  <Upload size={18} />
               </label>
               <input id="avatar-upload" type="file" className="hidden" accept="image/*" onChange={(e) => { if(e.target.files[0]) handleAvatarUpload(e.target.files[0]); }} />
            </form>
          </div>
         <div className="text-center md:text-left">
            <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">{profile.name}</h1>
            <p className="text-indigo-400 font-semibold uppercase tracking-widest text-xs flex items-center justify-center md:justify-start gap-2">
               <Shield size={14}/> {profile.role} account
            </p>
         </div>
      </div>

      {status && (
        <div className={`mb-8 p-4 rounded-xl flex items-center gap-3 border animate-in slide-in-from-top duration-300 ${status === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
           {status === 'success' ? <CheckCircle2 size={18}/> : <AlertCircle size={18} />}
           <span className="text-sm font-bold tracking-wide uppercase">{message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
         <div className="space-y-8">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><User size={16}/> Identity Metrics</h3>
            <form onSubmit={handleUpdate} className="space-y-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest ml-1">Full Name</label>
                  <div className="relative">
                     <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                     <input type="text" className="w-full bg-slate-900 border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all" value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} required />
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest ml-1">Email Address (Persistent)</label>
                  <div className="relative">
                     <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 opacity-50" />
                     <input type="email" className="w-full bg-slate-900/50 border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-slate-500 cursor-not-allowed" value={profile.email} disabled />
                  </div>
               </div>
               <button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/30 transition-all uppercase tracking-widest text-sm">Synchronize Profile</button>
            </form>
         </div>

         <div className="space-y-8">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><Lock size={16}/> Security Update</h3>
            <div className="glass p-8 bg-slate-900/40 rounded-3xl border border-white/5">
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">Modify your access credentials. For optimal protection, use a high-entropy passphrase with a mix of characters.</p>
                <form onSubmit={handleUpdate} className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest ml-1">New Passphrase</label>
                      <div className="relative">
                         <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                         <input type="password" placeholder="••••••••••••" className="w-full bg-slate-800 border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white focus:outline-none focus:border-indigo-500/30 transition-all" value={password} onChange={(e) => setPassword(e.target.value)} />
                      </div>
                   </div>
                   <button type="submit" className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl border border-white/5 transition-all uppercase tracking-widest text-sm">Apply New Security</button>
                </form>
            </div>
         </div>
      </div>
    </div>
  );
}
