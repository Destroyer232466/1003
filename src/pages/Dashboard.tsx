import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { getMural, getMyBulletins, getPolls, votePoll, dismissPoll } from "../services/api";
import { FileText, Calendar, Bell, ExternalLink, Download, Clock, Image as ImageIcon, Newspaper, ChevronLeft, ChevronRight, X, BarChart2 } from "lucide-react";

export default function Dashboard({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState("mural");
  const [mural, setMural] = useState<any[]>([]);
  const [bulletins, setBulletins] = useState<any[]>([]);
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  const photoPosts = mural.filter(p => p.type === 'photo');

  const fetchData = async () => {
    const token = localStorage.getItem("token") || "";
    try {
      const [muralData, bulletinData, pollsData] = await Promise.all([
        getMural(token),
        getMyBulletins(token),
        getPolls(token)
      ]);
      setMural(muralData);
      setBulletins(bulletinData);
      setPolls(pollsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleVote = async (pollId: number, optionIndex: number) => {
    const token = localStorage.getItem("token") || "";
    await votePoll(token, pollId, optionIndex);
    fetchData();
  };

  const handleDismiss = async (pollId: number) => {
    const token = localStorage.getItem("token") || "";
    await dismissPoll(token, pollId);
    fetchData();
  };

  const tabs = [
    { id: "mural", label: "Mural de Fotos", icon: ImageIcon },
    { id: "atividades", label: "Atividades", icon: Calendar },
    { id: "noticias", label: "Notícias", icon: Newspaper },
    { id: "enquetes", label: "Enquetes", icon: BarChart2 },
  ];

  if (loading) return <div className="flex items-center justify-center h-64 text-zinc-500">Carregando dados...</div>;

  return (
    <div className="space-y-8">
      {/* Tabs */}
      <div className="flex gap-4 border-b border-zinc-800 pb-4 overflow-x-auto custom-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold transition-all whitespace-nowrap ${
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

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {activeTab === "mural" && (
              <motion.div 
                key="mural"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {photoPosts.map((post, index) => (
                  <div key={post.id} className="card-brutalist overflow-hidden p-0 group relative">
                    {post.image_url && (
                      <div 
                        className="aspect-video overflow-hidden cursor-pointer"
                        onClick={() => setSelectedPhotoIndex(index)}
                      >
                        <img 
                          src={post.image_url} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                          alt={post.title}
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-bold">{post.title}</h3>
                        <div className="flex items-center gap-2">
                          <a 
                            href={post.image_url} 
                            download={post.title}
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 bg-zinc-800 hover:bg-electric-blue text-white rounded-lg transition-colors"
                            title="Baixar foto"
                          >
                            <Download size={14} />
                          </a>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {new Date(post.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {post.content && <p className="text-zinc-400 text-sm leading-relaxed">{post.content}</p>}
                    </div>
                  </div>
                ))}
                {photoPosts.length === 0 && (
                  <div className="col-span-full text-center py-20 text-zinc-600">
                    Nenhuma postagem no mural ainda.
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "atividades" && (
              <motion.div 
                key="atividades"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {mural.filter(p => p.type === 'activity').map((post) => (
                  <div key={post.id} className="card-brutalist">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-electric-blue/10 flex items-center justify-center text-electric-blue">
                          <Calendar size={20} />
                        </div>
                        <h3 className="text-xl font-bold">{post.title}</h3>
                      </div>
                      <span className="text-xs text-zinc-500 font-mono">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-zinc-400 leading-relaxed">{post.content}</p>
                  </div>
                ))}
                {mural.filter(p => p.type === 'activity').length === 0 && (
                  <div className="text-center py-20 text-zinc-600">
                    Nenhuma atividade agendada.
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "noticias" && (
              <motion.div 
                key="noticias"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {mural.filter(p => p.type === 'news').map((post) => (
                  <div key={post.id} className="card-brutalist">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-electric-blue/10 flex items-center justify-center text-electric-blue">
                          <Newspaper size={20} />
                        </div>
                        <h3 className="text-xl font-bold">{post.title}</h3>
                      </div>
                      <span className="text-xs text-zinc-500 font-mono">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-zinc-400 leading-relaxed">{post.content}</p>
                  </div>
                ))}
                {mural.filter(p => p.type === 'news').length === 0 && (
                  <div className="text-center py-20 text-zinc-600">
                    Nenhuma notícia publicada ainda.
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "enquetes" && (
              <motion.div 
                key="enquetes"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {polls.map((poll) => (
                  <div key={poll.id} className="card-brutalist">
                    <h3 className="text-xl font-bold mb-4">{poll.question}</h3>
                    {poll.userVote !== null ? (
                      <div className="space-y-2">
                        {poll.options.map((opt: string, i: number) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="flex-1 bg-zinc-800 rounded-lg p-2 text-sm">{opt}</div>
                            <div className="font-bold">{poll.voteCounts[i]} votos</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {poll.options.map((opt: string, i: number) => (
                          <button 
                            key={i} 
                            onClick={() => handleVote(poll.id, i)}
                            className="w-full text-left bg-zinc-800 hover:bg-electric-blue rounded-lg p-3 text-sm transition-all"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {polls.length === 0 && (
                  <div className="text-center py-20 text-zinc-600">
                    Nenhuma enquete disponível no momento.
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar - Bulletins */}
        <div className="space-y-6">
          {/* Poll Pop-up */}
          {polls.find(p => !p.dismissed && p.userVote === null) && (
            <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
              <div className="card-brutalist max-w-md w-full">
                <h3 className="text-xl font-bold mb-4">Nova Enquete!</h3>
                <p className="mb-4">{polls.find(p => !p.dismissed && p.userVote === null)?.question}</p>
                <div className="space-y-2 mb-4">
                  {polls.find(p => !p.dismissed && p.userVote === null)?.options.map((opt: string, i: number) => (
                    <button 
                      key={i} 
                      onClick={() => handleVote(polls.find(p => !p.dismissed && p.userVote === null)!.id, i)}
                      className="w-full text-left bg-zinc-800 hover:bg-electric-blue rounded-lg p-3 text-sm transition-all"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <button onClick={() => handleDismiss(polls.find(p => !p.dismissed && p.userVote === null)!.id)} className="text-xs text-zinc-500 hover:underline">Votar depois</button>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Meus Boletins</h3>
            {bulletins.length > 0 && (
              <span className="bg-electric-blue text-[10px] px-2 py-0.5 rounded-full font-bold">
                {bulletins.length}
              </span>
            )}
          </div>
          
          <div className="space-y-4">
            {bulletins.map((bulletin) => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key={bulletin.id} 
                className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-electric-blue transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-electric-blue group-hover:bg-electric-blue group-hover:text-white transition-colors">
                    <FileText size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{bulletin.original_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock size={12} className="text-zinc-500" />
                      <p className="text-[10px] text-zinc-500 font-mono">
                        {new Date(bulletin.received_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <a 
                    href={`/uploads/${bulletin.filename}`} 
                    download={bulletin.original_name}
                    className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                    title="Baixar arquivo"
                  >
                    <Download size={16} />
                  </a>
                </div>
              </motion.div>
            ))}
            {bulletins.length === 0 && (
              <div className="p-8 text-center border-2 border-dashed border-zinc-800 rounded-xl text-zinc-600 text-xs">
                Você ainda não recebeu boletins.
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Lightbox */}
      <AnimatePresence>
        {selectedPhotoIndex !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-12"
          >
            <button 
              onClick={() => setSelectedPhotoIndex(null)}
              className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-[110]"
            >
              <X size={24} />
            </button>

            <button 
              onClick={() => setSelectedPhotoIndex((prev) => (prev! > 0 ? prev! - 1 : photoPosts.length - 1))}
              className="absolute left-6 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-[110]"
            >
              <ChevronLeft size={32} />
            </button>

            <button 
              onClick={() => setSelectedPhotoIndex((prev) => (prev! < photoPosts.length - 1 ? prev! + 1 : 0))}
              className="absolute right-6 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-[110]"
            >
              <ChevronRight size={32} />
            </button>

            <div className="relative max-w-5xl w-full h-full flex flex-col items-center justify-center gap-6">
              <motion.img 
                key={photoPosts[selectedPhotoIndex].id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                src={photoPosts[selectedPhotoIndex].image_url} 
                className="max-w-full max-h-[80vh] object-contain shadow-2xl rounded-lg"
                alt={photoPosts[selectedPhotoIndex].title}
                referrerPolicy="no-referrer"
              />
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-2">{photoPosts[selectedPhotoIndex].title}</h3>
                <div className="flex items-center justify-center gap-4">
                  <a 
                    href={photoPosts[selectedPhotoIndex].image_url} 
                    download={photoPosts[selectedPhotoIndex].title}
                    className="flex items-center gap-2 px-6 py-2 bg-electric-blue text-white rounded-full font-bold hover:bg-blue-600 transition-all"
                  >
                    <Download size={18} />
                    <span>Baixar Foto</span>
                  </a>
                  <span className="text-zinc-500 text-sm">
                    {selectedPhotoIndex + 1} / {photoPosts.length}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
