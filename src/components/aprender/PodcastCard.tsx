import { useState, useRef, useEffect, forwardRef, useImperativeHandle, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Headphones,
  Play,
  Pause,
  Clock,
  FileText,
  ChevronDown,
  ChevronUp,
  BarChart2,
  Volume2,
  VolumeX
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Aula, Termo } from "@/lib/termosData";
import { cn } from "@/lib/utils";

export interface PodcastCardHandle {
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  isPlaying: boolean;
}

interface PodcastCardProps {
  aula: Aula;
  termos?: Termo[];
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
}

export const PodcastCard = forwardRef<PodcastCardHandle, PodcastCardProps>(({ aula, termos = [], onTimeUpdate, onEnded }, ref) => {
  const [showTranscript, setShowTranscript] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isSeeking, setIsSeeking] = useState(false);
  const isSeekingRef = useRef(false);
  // Ref para rastrear o último tempo válido (evita bug de closure stale)
  const lastKnownTimeRef = useRef(0);
  // Estado local para o slider, desacoplado do currentTime durante o drag
  const [sliderValue, setSliderValue] = useState([0]);

  // Converte duração "6" ou "2:08" para segundos (estimado) para fallback
  const estimatedDuration = useMemo(() => {
    if (!aula.duracao) return 0;
    if (aula.duracao.includes(":")) {
      const [mins, secs] = aula.duracao.split(":").map(Number);
      return (mins * 60) + (secs || 0);
    }
    return parseInt(aula.duracao) * 60;
  }, [aula.duracao]);

  useImperativeHandle(ref, () => ({
    play: () => {
      audioRef.current?.play();
      setIsPlaying(true);
    },
    pause: () => {
      audioRef.current?.pause();
      setIsPlaying(false);
    },
    seek: (time: number) => {
      if (audioRef.current) {
        audioRef.current.currentTime = time;
        setCurrentTime(time);
      }
    },
    isPlaying
  }));

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      if (!isSeekingRef.current) {
        // Proteção contra saltos para 0 inesperados do navegador durante transições de buffer
        // Usa ref em vez de state para evitar stale closure
        if (audio.currentTime === 0 && lastKnownTimeRef.current > 1 && !audio.paused) {
          return;
        }
        lastKnownTimeRef.current = audio.currentTime;
        setCurrentTime(audio.currentTime);
        setSliderValue([audio.currentTime]);
      }
      if (onTimeUpdate) {
        onTimeUpdate(audio.currentTime, audio.duration || estimatedDuration);
      }
    };

    const updateDuration = () => {
      setDuration(audio.duration);
      // Chama onTimeUpdate uma vez para garantir que duração seja passada
      if (onTimeUpdate) {
        onTimeUpdate(audio.currentTime, audio.duration);
      }
    };

    const handleEnded = () => {
      if (isSeekingRef.current) return; // Protege contra disparos falsos durante seek
      setIsPlaying(false);
      setCurrentTime(0);
      setSliderValue([0]);
      lastKnownTimeRef.current = 0;
      audio.currentTime = 0;
      if (onEnded) onEnded();
    };

    const handleSeeking = () => {
      isSeekingRef.current = true;
    };

    const handleSeeked = () => {
      // Delay para garantir que o buffer e o currentTime do navegador se estabilizaram
      setTimeout(() => {
        isSeekingRef.current = false;
        setIsSeeking(false);
      }, 200);
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("seeking", handleSeeking);
    audio.addEventListener("seeked", handleSeeked);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("seeking", handleSeeking);
      audio.removeEventListener("seeked", handleSeeked);
    };
  }, [onTimeUpdate, onEnded, estimatedDuration]);

  // Reset de estado ao mudar de aula
  useEffect(() => {
    setCurrentTime(0);
    setSliderValue([0]);
    setIsSeeking(false);
    isSeekingRef.current = false;
    lastKnownTimeRef.current = 0;
    // Removido reset manual do audio.currentTime para evitar conflito com troca de src
  }, [aula.id]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleValueChange = (value: number[]) => {
    isSeekingRef.current = true;
    setIsSeeking(true);
    setSliderValue(value);
    // Atualiza o áudio em tempo real durante o drag para feedback visual
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = value[0];
    }
  };

  const handleValueCommit = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = value[0];

    audio.currentTime = newTime;
    lastKnownTimeRef.current = newTime;
    setCurrentTime(newTime);
    setSliderValue([newTime]);

    // Tenta forçar o play caso o navegador tenha pausado durante o seek
    if (isPlaying) {
      audio.play().catch(() => { });
    }

    // Libera o lock de seeking após um breve delay para evitar conflitos
    setTimeout(() => {
      isSeekingRef.current = false;
      setIsSeeking(false);
    }, 300);
  };

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newVolume = value[0];
    audio.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  const skip = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + seconds));
  };

  const changePlaybackRate = () => {
    const audio = audioRef.current;
    if (!audio) return;

    const rates = [1, 1.25, 1.5, 1.75, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];

    audio.playbackRate = nextRate;
    setPlaybackRate(nextRate);
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const scrollToTerm = (termId: number) => {
    const element = document.getElementById(`term-${termId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });

      // Destaque temporário
      element.classList.add("ring-2", "ring-primary", "ring-offset-2", "ring-offset-slate-950");
      setTimeout(() => {
        element.classList.remove("ring-2", "ring-primary", "ring-offset-2", "ring-offset-slate-950");
      }, 2000);
    }
  };

  // Processa a transcrição para adicionar links clicáveis
  const processTranscript = (html: string) => {
    if (!termos.length || !html) return html;

    let tempHtml = html;

    // CORREÇÃO PONTUAL: Substitui "Tesouro Selic" por "Taxa Selic" para evitar botões divididos
    // Solicitado pelo usuário para a Aula 03
    tempHtml = tempHtml.replace(/Tesouro Selic/gi, "Taxa Selic");
    tempHtml = tempHtml.replace(/Tesouro\s+Selic/gi, "Taxa Selic"); // Garante com múltiplos espaços

    // CORREÇÃO PONTUAL: Impede que "Tesouro Nacional" vire botão (apenas "Tesouro Direto" deve ser)
    // Substituímos por um placeholder temporário que não será afetado pelo regex de termos
    const placeholderTesouro = "###PROTECTED_TESOURO_NACIONAL###";
    tempHtml = tempHtml.replace(/Tesouro Nacional/g, placeholderTesouro);

    // CORREÇÃO VISUAL: Centralizar a coluna "Garantia" na tabela
    // Tentativa de forçar alinhamento no cabeçalho. O conteúdo das células pode exigir CSS específico de tabela.
    tempHtml = tempHtml.replace(/<th>\s*Garantia\s*<\/th>/gi, '<th class="text-center">Garantia</th>');
    // Tenta cobrir caso tenha classes já
    tempHtml = tempHtml.replace(/<th([^>]*)>\s*Garantia\s*<\/th>/gi, (match, attrs) => {
      if (attrs.includes('text-center')) return match;
      return `<th${attrs} class="text-center">Garantia</th>`;
    });

    // 1. PROTEGER TAGS HTML:
    // Identifica todas as tags HTML e as substitui por placeholders seguros para evitar que
    // o regex de termos (ex: "PL") substitua classes (ex: "pl-2") e quebre o layout.
    // IMPORTANTE: Usamos caracteres não-alfabéticos (###) nas pontas para garantir que o regex \b (word boundary)
    // funcione corretamente quando o texto estiver colado numa tag (ex: <span>Termo</span> viraria ###TAG###Termo###TAG###)
    const tagPlaceholders: { placeholder: string; tag: string }[] = [];
    tempHtml = tempHtml.replace(/<[^>]+>/g, (match) => {
      const placeholder = `###HTML_TAG_${tagPlaceholders.length}_${Math.random().toString(36).substr(2, 5)}###`;
      tagPlaceholders.push({ placeholder, tag: match });
      return placeholder;
    });

    // 2. SUBSTITUIÇÃO DE TERMOS (no texto sem tags)
    const termReplacements: { placeholder: string; html: string }[] = [];

    termos.forEach((termo) => {
      if (!termo) return;

      // Cria lista de termos base (Sigla + Nome)
      let rawInputs = [termo.sigla, termo.nome];

      // Se a sigla tiver barra (ex: "LCI/LCA"), divide e adiciona as partes individualmente
      if (termo.sigla && termo.sigla.includes('/')) {
        const parts = termo.sigla.split('/').map(p => p.trim());
        rawInputs = [...rawInputs, ...parts];
      }

      // Deduplica e filtra inputs
      const inputs = [...new Set(rawInputs)]
        .filter(t => t && t.trim().length > 1)
        // Ordena por tamanho decrescente para evitar que "Renda" substitua "Renda Fixa" parcialmente
        .sort((a, b) => b.length - a.length);

      inputs.forEach((input) => {
        // Regex com Word Boundaries
        const regex = new RegExp(`\\b${input}\\b`, "gi");

        // Use a temporary array to store matches and their positions
        const matches: { match: string; index: number }[] = [];
        let match;
        while ((match = regex.exec(tempHtml)) !== null) {
          matches.push({ match: match[0], index: match.index });
        }

        // Replace from end to start to avoid index issues
        for (let i = matches.length - 1; i >= 0; i--) {
          const { match: originalMatch, index } = matches[i];
          // Placeholder também usa caracteres especiais para não confundir
          const uniquePlaceholder = `###TERM_PLACEHOLDER_${termo.id}_${Math.random().toString(36).substr(2, 9)}###`;

          termReplacements.push({
            placeholder: uniquePlaceholder,
            // AJUSTE VISUAL: Tamanho "meio termo" (11px) e padding equilibrado
            html: `<button
              class="term-link inline-flex items-center justify-center px-1.5 py-0.5 mx-[1px] rounded text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-400 hover:text-slate-900 cursor-pointer transition-all duration-300 transform hover:scale-105 shadow-sm whitespace-nowrap align-middle leading-none h-[20px]"
              data-term-id="${termo.id}"
              title="Clique para ver a explicação"
            >
              ${originalMatch}
            </button>`
          });

          tempHtml = tempHtml.substring(0, index) + uniquePlaceholder + tempHtml.substring(index + originalMatch.length);
        }
      });
    });

    // 3. RESTAURAR TAGS HTML ORIGINAIS
    // Fazemos isso ANTES de expandir os botões, para garantir que os placeholders de tag não se misturem
    tagPlaceholders.forEach(({ placeholder, tag }) => {
      tempHtml = tempHtml.replace(placeholder, tag);
    });

    // 4. APLICA AS SUBSTITUIÇÕES FINAIS (Term Placeholders -> Botões)
    termReplacements.forEach(({ placeholder, html }) => {
      tempHtml = tempHtml.replace(new RegExp(placeholder.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), html);
    });

    // RESTAURA PROTEÇÕES (Tesouro Nacional)
    tempHtml = tempHtml.replace(new RegExp("###PROTECTED_TESOURO_NACIONAL###", 'g'), "Tesouro Nacional");

    return tempHtml;
  };

  useEffect(() => {
    // Adiciona event listeners nos links de termos
    const handleTermClick = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains("term-link")) {
        const termId = target.getAttribute("data-term-id");
        if (termId) {
          scrollToTerm(parseInt(termId));
        }
      }
    };

    document.addEventListener("click", handleTermClick);
    return () => document.removeEventListener("click", handleTermClick);
  }, [termos]);

  // 1. Lógica de Cores para Badge (Interno)
  const levelBadgeColor =
    aula.nivel === 'fundamentos' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' :
      aula.nivel === 'pratica' ? 'text-amber-400 border-amber-500/20 bg-amber-500/10' :
        'text-rose-400 border-rose-500/20 bg-rose-500/10';

  // 2. Lógica de "Glow" para o Card (Borda e Sombra externa no Hover)
  const glowStyles =
    aula.nivel === 'fundamentos' ? 'hover:border-emerald-500/30 hover:shadow-emerald-500/10' :
      aula.nivel === 'pratica' ? 'hover:border-amber-500/30 hover:shadow-amber-500/10' :
        'hover:border-rose-500/30 hover:shadow-rose-500/10';

  return (
    <div className="w-full perspective-1000">
      {/* Áudio oculto - MOVIDO PARA FORA DO MOTION.DIV PARA SER ESTÁVEL */}
      <audio
        ref={audioRef}
        src={`/audios/Aula-${aula.id}.mp3`}
        preload="auto"
      />

      <motion.div
        key={aula.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={cn(
          "group relative overflow-hidden rounded-[32px] transition-all duration-300 ease-out",
          "border border-white/10",
          "bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950",
          glowStyles,
          "hover:shadow-2xl hover:-translate-y-1.5"
        )}
      >
        {/* Camada Interna para Efeito de Vidro */}
        <div className="relative p-6 md:p-10 z-10">

          {/* Efeito de Glow Atmosférico de Fundo */}
          <div className="absolute -top-20 -right-20 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] opacity-20 pointer-events-none mix-blend-screen" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-8">

            {/* --- CAPA DO ÁLBUM (ÍCONE) --- */}
            <div className="group/icon relative w-24 h-24 md:w-32 md:h-32 shrink-0">
              {/* Glow atrás do ícone */}
              <div className="absolute inset-0 bg-white/5 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative w-full h-full rounded-3xl bg-gradient-to-br from-slate-800 to-slate-950 border border-white/10 flex items-center justify-center shadow-2xl transition-transform duration-500 group-hover/icon:scale-105 group-hover/icon:-rotate-3">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                <Headphones className="w-10 h-10 md:w-12 md:h-12 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" />

                {/* Visualizador de Áudio Fake - só mostra quando está tocando */}
                {isPlaying && (
                  <div className="absolute bottom-4 flex gap-1 items-end h-4">
                    <div className="w-1 bg-primary/50 rounded-full animate-[music-bar_1s_ease-in-out_infinite] h-2" />
                    <div className="w-1 bg-primary/50 rounded-full animate-[music-bar_1.2s_ease-in-out_infinite_0.1s] h-4" />
                    <div className="w-1 bg-primary/50 rounded-full animate-[music-bar_0.8s_ease-in-out_infinite_0.2s] h-3" />
                  </div>
                )}
              </div>
            </div>

            {/* --- CONTEÚDO DE TEXTO --- */}
            <div className="flex-1 w-full space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className={cn("text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border shadow-sm transition-colors", levelBadgeColor)}>
                  {aula.nivel}
                </span>
                <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/5 group-hover:border-white/10 transition-colors">
                  <Clock className="w-3.5 h-3.5" />
                  {aula.duracao}
                </span>
              </div>

              <div>
                <h3 className="font-display text-2xl md:text-4xl font-bold text-white leading-tight mb-3 tracking-tight group-hover:text-primary transition-colors duration-300">
                  {aula.tituloCompleto || aula.titulo}
                </h3>
                <p className="text-sm md:text-base text-slate-400 leading-relaxed max-w-2xl font-light">
                  {aula.descricao}
                </p>
              </div>

              {/* --- PLAYER DE ÁUDIO --- */}
              <div className="pt-4 space-y-4">
                {/* Barra de Progresso */}
                <div className="space-y-2 py-2 cursor-pointer">
                  <Slider
                    value={sliderValue}
                    max={duration || estimatedDuration}
                    step={0.1}
                    onValueChange={handleValueChange}
                    onValueCommit={handleValueCommit}
                    className="cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-slate-400 font-mono">
                    <span>{formatTime(sliderValue[0])}</span>
                    <span>{formatTime(duration || estimatedDuration)}</span>
                  </div>
                </div>

                {/* Controles do Player */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Botão Play/Pause Principal */}
                  <Button
                    onClick={togglePlayPause}
                    size="lg"
                    className="relative overflow-hidden bg-white text-slate-900 hover:bg-slate-200 shadow-[0_0_30px_rgba(255,255,255,0.1)] rounded-full px-8 h-14 font-bold text-base transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] group/btn"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] group-hover/btn:animate-shimmer" />
                    {isPlaying ? (
                      <Pause className="w-5 h-5 mr-3 fill-current" />
                    ) : (
                      <Play className="w-5 h-5 mr-3 fill-current" />
                    )}
                    {isPlaying ? "Pausar" : "Começar Aula"}
                  </Button>

                  {/* Controles Secundários */}
                  <div className="flex items-center gap-2">

                    {/* Volume (Desktop) */}
                    <div className="hidden md:flex items-center gap-2 ml-2">
                      <Button
                        onClick={toggleMute}
                        variant="ghost"
                        size="sm"
                        className="h-10 w-10 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 p-0"
                      >
                        {isMuted ? (
                          <VolumeX className="w-4 h-4" />
                        ) : (
                          <Volume2 className="w-4 h-4" />
                        )}
                      </Button>
                      <Slider
                        value={[isMuted ? 0 : volume]}
                        max={1}
                        step={0.01}
                        onValueChange={handleVolumeChange}
                        className="w-24 cursor-pointer"
                      />
                    </div>

                    {/* Velocidade */}
                    <Button
                      onClick={changePlaybackRate}
                      variant="ghost"
                      size="sm"
                      className="h-10 px-3 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold"
                    >
                      {playbackRate}x
                    </Button>
                  </div>

                  {/* Botão de Transcrição */}
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={() => setShowTranscript(!showTranscript)}
                    className="h-14 px-6 rounded-full border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all gap-2 group/btn ml-auto"
                  >
                    {showTranscript ? <ChevronUp className="w-4 h-4" /> : <FileText className="w-4 h-4 group-hover/btn:text-primary transition-colors" />}
                    <span className="font-medium">{showTranscript ? "Fechar Texto" : "Ler Transcrição"}</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* --- ÁREA DE TRANSCRIÇÃO --- */}
          <AnimatePresence>
            {showTranscript && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="pt-8 mt-8 border-t border-white/10 relative">
                  <div className="absolute top-8 left-0 md:left-8 w-1 h-full bg-gradient-to-b from-primary/50 to-transparent rounded-full opacity-50" />
                  <div className="pl-6 md:pl-12">
                    <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                      <BarChart2 className="w-4 h-4" /> Transcrição do Áudio
                    </h4>

                    {/* Dica sobre links clicáveis */}
                    {termos.length > 0 && (
                      <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                        <p className="text-xs text-emerald-300/80 flex items-start gap-2">
                          <svg className="w-4 h-4 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          <span>
                            <strong>Dica:</strong> Clique nos termos destacados em <strong>verde</strong> para ver a explicação detalhada abaixo.
                          </span>
                        </p>
                      </div>
                    )}

                    <div
                      className={cn(
                        "prose prose-invert prose-p:text-slate-200 prose-p:leading-loose prose-headings:text-primary prose-strong:text-white prose-li:text-slate-200 max-w-none text-lg tracking-wide space-y-8",
                        "[&_.term-link]:inline-flex [&_.term-link]:items-center [&_.term-link]:gap-1 [&_.term-link]:mx-1 [&_.term-link]:transform [&_.term-link]:transition-all"
                      )}
                      dangerouslySetInnerHTML={{ __html: processTranscript(aula.transcricaoCompleta) }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </motion.div>
    </div>
  );
});
