import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { getUsers, getStats, uploadBulletin, createPost, getMural, deletePost, createUser, deleteUser, getPolls, createPoll, deletePoll, getBulletinsForUser, deleteBulletin } from "../services/api";
import { Users, Upload, CheckCircle, AlertCircle, Search, User, FileUp, Loader2, Newspaper, Image as ImageIcon, Trash2, Plus, X, Activity, UserPlus, Mail, Lock, BarChart2 } from "lucide-react";

export default function Admin({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState("boletins");
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ userCount: 0 });
  const [mural, setMural] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userBulletins, setUserBulletins] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Post form state
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [postImage, setPostImage] = useState<File | null>(null);
  const postImageRef = useRef<HTMLInputElement>(null);

  // User management state
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");

  // Activity scheduling state
  const [scheduledDay, setScheduledDay] = useState("");
  const [scheduledMonth, setScheduledMonth] = useState("");

  // Poll management state
  const [polls, setPolls] = useState<any[]>([]);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [pollScheduledDay, setPollScheduledDay] = useState("");
  const [pollScheduledMonth, setPollScheduledMonth] = useState("");

  const getDaysInMonth = (month: string) => {
    if (!month) return 31;
    const year = new Date().getFullYear();
    return new Date(year, parseInt(month), 0).getDate();
  };

  const activityDays = getDaysInMonth(scheduledMonth);
  const pollDays = getDaysInMonth(pollScheduledMonth);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchUserBulletins();
    } else {
      setUserBulletins([]);
    }
  }, [selectedUser]);

  const fetchUserBulletins = async () => {
    if (!selectedUser) return;
    const token = localStorage.getItem("token") || "";
    try {
      const bulletins = await getBulletinsForUser(token, selectedUser.id);
      setUserBulletins(bulletins);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInitialData = async () => {
    const token = localStorage.getItem("token") || "";
    try {
      const [usersData, statsData, muralData, pollsData] = await Promise.all([
        getUsers(token),
        getStats(token),
        getMural(token),
        getPolls(token)
      ]);
      setUsers(usersData);
      setStats(statsData);
      setMural(muralData);
      setPolls(pollsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedUser || !file) return;
    
    setUploading(true);
    setMessage({ type: "", text: "" });
    const token = localStorage.getItem("token") || "";

    try {
      await uploadBulletin(token, selectedUser.id, file);
      setMessage({ type: "success", text: `Boletim enviado com sucesso para ${selectedUser.name}!` });
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchUserBulletins();
    } catch (err) {
      setMessage({ type: "error", text: "Erro ao enviar boletim. Tente novamente." });
    } finally {
      setUploading(false);
    }
  };

  const handleCreatePost = async (type: string) => {
    if (!postTitle) return;
    setUploading(true);
    const token = localStorage.getItem("token") || "";

    let scheduledDate = undefined;
    if (type === 'activity' && scheduledDay && scheduledMonth) {
      const year = new Date().getFullYear();
      // Create a date object for the end of that day (23:59:59)
      const date = new Date(year, parseInt(scheduledMonth) - 1, parseInt(scheduledDay), 23, 59, 59);
      scheduledDate = date.toISOString();
    }

    try {
      await createPost(token, {
        title: postTitle,
        content: postContent,
        type: type,
        image: postImage || undefined,
        scheduled_date: scheduledDate
      });
      setPostTitle("");
      setPostContent("");
      setPostImage(null);
      setScheduledDay("");
      setScheduledMonth("");
      if (postImageRef.current) postImageRef.current.value = "";
      fetchInitialData();
      setMessage({ type: "success", text: "Postagem criada com sucesso!" });
    } catch (err) {
      setMessage({ type: "error", text: "Erro ao criar postagem." });
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePost = async (id: number) => {

    const token = localStorage.getItem("token") || "";

    try {
      await deletePost(token, id);

      setMural(prev => prev.filter(p => p.id !== id));

      setMessage({
        type: "success",
        text: "Post excluído com sucesso!"
      });

    } catch (err) {
      console.error(err);
      setMessage({
        type: "error",
        text: "Erro ao excluir post"
      });
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail || !newUserPassword) return;
    setUploading(true);
    const token = localStorage.getItem("token") || "";
    try {
      const res = await createUser(token, { name: newUserName, email: newUserEmail, password: newUserPassword });
      if (res.error) {
        setMessage({ type: "error", text: res.error });
      } else {
        setNewUserName("");
        setNewUserEmail("");
        setNewUserPassword("");
        fetchInitialData();
        setMessage({ type: "success", text: "Usuário criado com sucesso!" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Erro ao criar usuário." });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    console.log("Tentando excluir usuário:", id);
    const token = localStorage.getItem("token") || "";
    try {
      await deleteUser(token, id);
      console.log("Usuário excluído com sucesso");
      fetchInitialData();
    } catch (err) {
      console.error("Erro ao excluir usuário:", err);
    }
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pollQuestion || pollOptions.some(o => !o)) return;
    setUploading(true);
    const token = localStorage.getItem("token") || "";

    let scheduledDate = undefined;
    if (pollScheduledDay && pollScheduledMonth) {
      const year = new Date().getFullYear();
      const date = new Date(year, parseInt(pollScheduledMonth) - 1, parseInt(pollScheduledDay), 23, 59, 59);
      scheduledDate = date.toISOString();
    }

    try {
      await createPoll(token, { question: pollQuestion, options: pollOptions, scheduled_date: scheduledDate });
      setPollQuestion("");
      setPollOptions(["", ""]);
      setPollScheduledDay("");
      setPollScheduledMonth("");
      fetchInitialData();
      setMessage({ type: "success", text: "Enquete criada com sucesso!" });
    } catch (err) {
      setMessage({ type: "error", text: "Erro ao criar enquete." });
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePoll = async (id: number) => {
    console.log("Tentando excluir enquete:", id);
    const token = localStorage.getItem("token") || "";
    try {
      await deletePoll(token, id);
      console.log("Enquete excluída com sucesso");
      fetchInitialData();
    } catch (err) {
      console.error("Erro ao excluir enquete:", err);
    }
  };

  const handleDeleteBulletin = async (id: number) => {
    const token = localStorage.getItem("token") || "";
    try {
      await deleteBulletin(token, id);
      fetchUserBulletins();
      setMessage({ type: "success", text: "Boletim excluído com sucesso!" });
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Erro ao excluir boletim." });
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex items-center gap-2"><Loader2 className="animate-spin" /> Carregando painel...</div>;

  return (
    <div className="space-y-8">
      {/* Tabs */}
      <div className="flex gap-4 border-b border-zinc-800 pb-4">
        {[
          { id: "boletins", label: "Boletins", icon: FileUp },
          { id: "mural", label: "Mural de Fotos", icon: ImageIcon },
          { id: "noticias", label: "Notícias", icon: Newspaper },
          { id: "atividades", label: "Atividades", icon: Activity },
          { id: "usuarios", label: "Usuários", icon: Users },
          { id: "enquetes", label: "Enquetes", icon: BarChart2 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold transition-all ${
              activeTab === tab.id 
                ? "bg-electric-blue text-white" 
                : "text-zinc-500 hover:text-white hover:bg-zinc-800"
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "boletins" && (
          <motion.div 
            key="boletins"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* User Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Selecionar Usuário</h3>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input 
                    type="text" 
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 rounded-full py-1.5 pl-10 pr-4 text-sm focus:border-electric-blue outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredUsers.map((u) => (
                  <div 
                    key={u.id}
                    onClick={() => setSelectedUser(u)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-4 ${
                      selectedUser?.id === u.id 
                        ? "selected-user" 
                        : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-600"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      selectedUser?.id === u.id ? "bg-white text-electric-blue" : "bg-zinc-800 text-zinc-400"
                    }`}>
                      {u.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate">{u.name}</p>
                      <p className={`text-xs truncate ${selectedUser?.id === u.id ? "text-white/70" : "text-zinc-500"}`}>
                        {u.email}
                      </p>
                    </div>
                    {selectedUser?.id === u.id && <CheckCircle size={20} />}
                  </div>
                ))}
              </div>
            </div>

            {/* Upload Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Enviar Boletim</h3>
              <div className={`card-brutalist h-full flex flex-col justify-center items-center text-center p-12 border-dashed ${!selectedUser ? "opacity-50 pointer-events-none" : ""}`}>
                {!selectedUser ? (
                  <div className="space-y-4">
                    <User size={48} className="mx-auto text-zinc-700" />
                    <p className="text-zinc-500">Selecione um usuário à esquerda para habilitar o envio.</p>
                  </div>
                ) : (
                  <div className="w-full space-y-6">
                    <div className="flex items-center justify-center gap-2 text-electric-blue mb-4">
                      <FileUp size={24} />
                      <span className="font-bold">Para: {selectedUser.name}</span>
                    </div>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-zinc-700 rounded-2xl p-8 hover:border-electric-blue hover:bg-electric-blue/5 transition-all cursor-pointer"
                    >
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.jpg,.jpeg,.png" />
                      {file ? (
                        <div className="space-y-2">
                          <p className="text-sm font-bold text-white">{file.name}</p>
                          <p className="text-xs text-zinc-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                          <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-xs text-red-500 hover:underline">Remover arquivo</button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload size={32} className="mx-auto text-zinc-600" />
                          <p className="text-sm font-bold">Clique para selecionar</p>
                          <p className="text-xs text-zinc-500">PDF, JPG ou PNG (Max 10MB)</p>
                        </div>
                      )}
                    </div>
                    <button onClick={handleUpload} disabled={!file || uploading} className="w-full btn-electric py-4 flex items-center justify-center gap-2">
                      {uploading ? <><Loader2 size={20} className="animate-spin" /><span>Enviando...</span></> : <><Upload size={20} /><span>Disparar Boletim</span></>}
                    </button>
                    {message.text && activeTab === "boletins" && (
                      <div className={`flex items-center gap-2 p-4 rounded-lg text-sm font-bold ${message.type === "success" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                        {message.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                        {message.text}
                      </div>
                    )}

                    {/* Bulletins List */}
                    <div className="mt-8 space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500 text-left">Boletins de {selectedUser.name}</h4>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {userBulletins.map((b) => (
                          <div key={b.id} className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                            <div className="flex-1 min-w-0 text-left">
                              <p className="text-sm font-bold truncate">{b.original_name}</p>
                              <p className="text-xs text-zinc-500">{new Date(b.received_at).toLocaleDateString()}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <a 
                                href={`/uploads/${b.filename}`} 
                                target="_blank" 
                                rel="noreferrer"
                                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
                              >
                                <FileUp size={16} />
                              </a>
                              <button 
                                onClick={() => handleDeleteBulletin(b.id)}
                                className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                        {userBulletins.length === 0 && (
                          <p className="text-xs text-zinc-600 py-4">Nenhum boletim enviado para este usuário.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {(activeTab === "mural" || activeTab === "noticias" || activeTab === "atividades") && (
          <motion.div 
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Create Post Form */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">
                {activeTab === "mural" ? "Nova Foto no Mural" : activeTab === "noticias" ? "Nova Notícia" : "Nova Atividade"}
              </h3>
              <div className="card-brutalist space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Título</label>
                  <input 
                    type="text" 
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                    className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-lg p-3 focus:border-electric-blue outline-none transition-all"
                    placeholder="Digite o título..."
                  />
                </div>
                {(activeTab === "noticias" || activeTab === "atividades") && (
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Conteúdo</label>
                    <textarea 
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                      className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-lg p-3 focus:border-electric-blue outline-none transition-all h-32"
                      placeholder={`Digite o conteúdo da ${activeTab === "noticias" ? "notícia" : "atividade"}...`}
                    />
                  </div>
                )}
                {activeTab === "atividades" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Dia De Fim</label>
                      <select 
                        value={scheduledDay}
                        onChange={(e) => setScheduledDay(e.target.value)}
                        className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-lg p-3 focus:border-electric-blue outline-none transition-all"
                      >
                        <option value="">Selecione...</option>
                        {Array.from({ length: activityDays }, (_, i) => i + 1).map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Mês De Fim</label>
                      <select 
                        value={scheduledMonth}
                        onChange={(e) => setScheduledMonth(e.target.value)}
                        className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-lg p-3 focus:border-electric-blue outline-none transition-all"
                      >
                        <option value="">Selecione...</option>
                        {[
                          "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
                          "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
                        ].map((m, i) => (
                          <option key={i + 1} value={i + 1}>{m}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
                {activeTab === "mural" && (
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Imagem</label>
                    <div 
                      onClick={() => postImageRef.current?.click()}
                      className="border-2 border-dashed border-zinc-700 rounded-lg p-6 hover:border-electric-blue hover:bg-electric-blue/5 transition-all cursor-pointer text-center"
                    >
                      <input 
                        type="file" 
                        ref={postImageRef}
                        onChange={(e) => e.target.files && setPostImage(e.target.files[0])}
                        className="hidden"
                        accept="image/*"
                      />
                      {postImage ? (
                        <div className="flex items-center justify-between">
                          <span className="text-sm truncate flex-1">{postImage.name}</span>
                          <X size={16} className="text-red-500" onClick={(e) => { e.stopPropagation(); setPostImage(null); }} />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <ImageIcon size={24} className="text-zinc-600" />
                          <span className="text-xs text-zinc-500">Clique para selecionar foto</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <button 
                  onClick={() => handleCreatePost(activeTab === "mural" ? "photo" : activeTab === "noticias" ? "news" : "activity")}
                  disabled={!postTitle || uploading || (activeTab === "mural" && !postImage)}
                  className="w-full btn-electric py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                  <span>Publicar</span>
                </button>
              </div>
            </div>

            {/* List Posts */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Existentes</h3>
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {mural.filter(p => p.type === (activeTab === "mural" ? "photo" : activeTab === "noticias" ? "news" : "activity")).map((post) => (
                  <div key={post.id} className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-4">
                    {post.image_url && (
                      <img src={post.image_url} className="w-12 h-12 rounded object-cover" alt="" referrerPolicy="no-referrer" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate">{post.title}</p>
                      <p className="text-xs text-zinc-500">{new Date(post.created_at).toLocaleDateString()}</p>
                    </div>
                    <button 
                    onClick={async () => {
                      try {
                        await handleDeletePost(post.id);
                      } catch (e) {
                        console.error(e);
                      }
                    }}
                      className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                {mural.filter(p => p.type === (activeTab === "mural" ? "photo" : activeTab === "noticias" ? "news" : "activity")).length === 0 && (
                  <div className="text-center py-10 text-zinc-600 text-sm">Nenhuma postagem encontrada.</div>
                )}
              </div>
            </div>
          </motion.div>
        )}
        {activeTab === "usuarios" && (
          <motion.div 
            key="usuarios"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Create User Form */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Novo Usuário</h3>
              <form onSubmit={handleCreateUser} className="card-brutalist space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Nome Completo</label>
                  <div className="relative">
                    <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input 
                      type="text" 
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-lg py-3 pl-10 pr-4 focus:border-electric-blue outline-none transition-all"
                      placeholder="Ex: João Silva"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">E-mail</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input 
                      type="email" 
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-lg py-3 pl-10 pr-4 focus:border-electric-blue outline-none transition-all"
                      placeholder="exemplo@email.com"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Senha</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input 
                      type="password" 
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-lg py-3 pl-10 pr-4 focus:border-electric-blue outline-none transition-all"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
                <button 
                  type="submit"
                  disabled={uploading}
                  className="w-full btn-electric py-3 flex items-center justify-center gap-2"
                >
                  {uploading ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
                  <span>Criar Usuário</span>
                </button>
                {message.text && activeTab === "usuarios" && (
                  <div className={`flex items-center gap-2 p-4 rounded-lg text-sm font-bold ${message.type === "success" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                    {message.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    {message.text}
                  </div>
                )}
              </form>
            </div>

            {/* List Users */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Usuários Ativos</h3>
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {users.map((u) => (
                  <div key={u.id} className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-electric-blue">
                      {u.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate">{u.name}</p>
                      <p className="text-xs text-zinc-500 truncate">{u.email}</p>
                    </div>
                    <button 
                      onClick={() => {
                        console.log("Botão de excluir usuário clicado:", u.id);
                        handleDeleteUser(u.id);
                      }}
                      className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                {users.length === 0 && (
                  <div className="text-center py-10 text-zinc-600 text-sm">Nenhum usuário cadastrado.</div>
                )}
              </div>
            </div>
          </motion.div>
        )}
        {activeTab === "enquetes" && (
          <motion.div 
            key="enquetes"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Create Poll Form */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Nova Enquete</h3>
              <form onSubmit={handleCreatePoll} className="card-brutalist space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Pergunta</label>
                  <input 
                    type="text" 
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-lg p-3 focus:border-electric-blue outline-none transition-all"
                    placeholder="Qual a sua pergunta?"
                    required
                  />
                </div>
                {pollOptions.map((opt, i) => (
                  <div key={i}>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Opção {i + 1}</label>
                    <input 
                      type="text" 
                      value={opt}
                      onChange={(e) => {
                        const newOptions = [...pollOptions];
                        newOptions[i] = e.target.value;
                        setPollOptions(newOptions);
                      }}
                      className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-lg p-3 focus:border-electric-blue outline-none transition-all"
                      placeholder={`Opção ${i + 1}`}
                      required
                    />
                  </div>
                ))}
                <button type="button" onClick={() => setPollOptions([...pollOptions, ""])} className="text-xs text-electric-blue hover:underline">+ Adicionar opção</button>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Dia de Fim</label>
                    <select 
                      value={pollScheduledDay}
                      onChange={(e) => setPollScheduledDay(e.target.value)}
                      className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-lg p-3 focus:border-electric-blue outline-none transition-all"
                    >
                      <option value="">Selecione...</option>
                      {Array.from({ length: pollDays }, (_, i) => i + 1).map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Mês de Fim</label>
                    <select 
                      value={pollScheduledMonth}
                      onChange={(e) => setPollScheduledMonth(e.target.value)}
                      className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-lg p-3 focus:border-electric-blue outline-none transition-all"
                    >
                      <option value="">Selecione...</option>
                      {[
                        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
                        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
                      ].map((m, i) => (
                        <option key={i + 1} value={i + 1}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <button 
                  type="submit"
                  disabled={uploading}
                  className="w-full btn-electric py-3 flex items-center justify-center gap-2"
                >
                  {uploading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                  <span>Criar Enquete</span>
                </button>
                {message.text && activeTab === "enquetes" && (
                  <div className={`flex items-center gap-2 p-4 rounded-lg text-sm font-bold ${message.type === "success" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                    {message.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    {message.text}
                  </div>
                )}
              </form>
            </div>

            {/* List Polls */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Enquetes Ativas</h3>
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {polls.map((p) => (
                  <div key={p.id} className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex justify-between items-center">
                    <div>
                      <p className="font-bold">{p.question}</p>
                      <p className="text-xs text-zinc-500">Encerra em: {p.scheduled_date ? new Date(p.scheduled_date).toLocaleDateString() : "Nunca"}</p>
                    </div>
                    <button 
                      onClick={() => {
                        console.log("Botão de excluir enquete clicado:", p.id);
                        handleDeletePoll(p.id);
                      }}
                      className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                {polls.length === 0 && (
                  <div className="text-center py-10 text-zinc-600 text-sm">Nenhuma enquete cadastrada.</div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
