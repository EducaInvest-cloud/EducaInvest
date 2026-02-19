import { useState, useEffect, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import {
  Calculator,
  TrendingUp,
  Percent,
  DollarSign,
  Calendar,
  Lock,
  Unlock,
  Clock,
  Save,
  Loader2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MarketRates } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CalculatorProps {
  rates: MarketRates;
  userId?: string;
}

export function CompoundInterestCalculator({ rates, userId }: CalculatorProps) {
  const [initialValue, setInitialValue] = useState(1000);
  const [monthlyInvestment, setMonthlyInvestment] = useState(500);
  const [years, setYears] = useState(10);
  const [rateType, setRateType] = useState<'SELIC' | 'CDI' | 'IPCA' | 'POUPANCA' | 'CUSTOM'>('SELIC');
  const [annualRate, setAnnualRate] = useState(rates.selic || 0);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (rateType === 'SELIC' && rates.selic) setAnnualRate(rates.selic);
    if (rateType === 'CDI' && rates.cdi) setAnnualRate(rates.cdi);
    if (rateType === 'IPCA' && rates.ipca) setAnnualRate(rates.ipca);
    if (rateType === 'POUPANCA' && rates.poupanca) setAnnualRate(rates.poupanca);
  }, [rateType, rates]);

  const results = useMemo(() => {
    // Converte taxa anual para mensal (Juros Compostos Reais: (1 + taxa)^(1/12) - 1)
    const monthlyRate = Math.pow(1 + annualRate / 100, 1 / 12) - 1;
    const months = years * 12;

    let totalAmount = initialValue;
    let totalInvested = initialValue;
    const chartData = [];

    chartData.push({
      year: 0,
      "Juros Compostos": initialValue,
      "Sem Juros": initialValue,
    });

    for (let i = 1; i <= months; i++) {
      totalAmount = totalAmount * (1 + monthlyRate) + monthlyInvestment;
      totalInvested += monthlyInvestment;

      if (i % 12 === 0) {
        chartData.push({
          year: i / 12,
          "Juros Compostos": Math.round(totalAmount),
          "Sem Juros": Math.round(totalInvested),
        });
      }
    }

    const totalInterest = totalAmount - totalInvested;

    return {
      total: totalAmount,
      invested: totalInvested,
      interest: totalInterest,
      chartData,
    };
  }, [initialValue, monthlyInvestment, annualRate, years]);

  // Função de formatação padronizada para 2 casas decimais
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Função para o display do número nos inputs (sem o símbolo R$)
  const formatNumberDisplay = (value: number) => {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: number) => void) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    setter(Number(rawValue) / 100);
  };

  const handleSaveSimulation = async () => {
    if (!userId) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para salvar simulações.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from('simulacoes').insert({
        usuario_id: userId,
        tipo_ativo: 'JUROS_COMPOSTOS', // ou outro identificador
        valor_inicial: initialValue,
        prazo_meses: years * 12,
        resultado_estimado: results.total,
        // Outros campos que a tabela possa ter:
        // aporte_mensal: monthlyInvestment,
        // taxa_anual: annualRate
      });

      if (error) throw error;

      toast({
        title: "Simulação salva!",
        description: "Você pode acessá-la na sua Dashboard.",
      });
    } catch (error) {
      console.error('Erro ao salvar simulação:', error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar sua simulação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const rateOptions = [
    { id: 'SELIC', label: 'SELIC', value: rates.selic, color: 'bg-primary' },
    { id: 'CDI', label: 'CDI', value: rates.cdi, color: 'bg-indigo-500' },
    { id: 'POUPANCA', label: 'Poupança', value: rates.poupanca, color: 'bg-emerald-500' },
    { id: 'IPCA', label: 'IPCA', value: rates.ipca, color: 'bg-amber-500' },
    { id: 'CUSTOM', label: 'Personalizado', value: null, color: 'bg-slate-500' },
  ];

  return (
    <div className="grid lg:grid-cols-12 gap-8 text-foreground">

      <style>{`
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { 
          -webkit-appearance: none; 
          margin: 0; 
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>

      {/* --- COLUNA ESQUERDA: CONTROLES --- */}
      <div className="lg:col-span-5 space-y-8">

        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Percent className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Taxa Anual de Rentabilidade</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {rateOptions.map((option) => {
              const isActive = rateType === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => setRateType(option.id as any)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border cursor-pointer",
                    isActive
                      ? "bg-primary text-white border-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.4)] scale-105"
                      : "bg-slate-800/50 text-slate-400 border-white/10 hover:border-white/30 hover:text-white"
                  )}
                >
                  {option.label}
                  {option.value ? ` ${option.value}%` : ''}
                </button>
              );
            })}
          </div>

          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-muted-foreground">
              {rateType === 'CUSTOM' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </div>
            <Input
              type="number"
              value={annualRate}
              onChange={(e) => {
                if (rateType === 'CUSTOM') setAnnualRate(Number(e.target.value));
              }}
              readOnly={rateType !== 'CUSTOM'}
              className={cn(
                "pl-14 h-14 text-lg font-medium bg-slate-950/50 border-white/10 rounded-xl transition-all",
                "focus-visible:ring-offset-0 focus-visible:ring-1",
                rateType === 'CUSTOM'
                  ? "border-primary/50 focus-visible:ring-primary text-white"
                  : "opacity-80 cursor-not-allowed text-muted-foreground bg-slate-900/30 border-transparent focus-visible:ring-0"
              )}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">% ao ano</span>
          </div>
        </div>

        {/* 2. VALOR INICIAL */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-bold text-slate-300">Investimento Inicial</span>
            </div>

            <div className="relative w-40">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary font-semibold text-sm pointer-events-none">
                R$
              </span>
              <Input
                type="text"
                value={formatNumberDisplay(initialValue)}
                onChange={(e) => handleInputChange(e, setInitialValue)}
                className="h-10 pl-9 pr-3 text-right font-medium bg-primary/5 border-primary/20 text-primary rounded-lg focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary placeholder:text-primary/30"
              />
            </div>
          </div>
          <Slider
            value={[initialValue]}
            min={0}
            max={50000}
            step={100}
            onValueChange={(v) => setInitialValue(v[0])}
            className="py-2 cursor-pointer"
          />
        </div>

        {/* 3. APORTE MENSAL */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-bold text-slate-300">Aporte Mensal</span>
            </div>

            <div className="relative w-40">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary font-semibold text-sm pointer-events-none">
                R$
              </span>
              <Input
                type="text"
                value={formatNumberDisplay(monthlyInvestment)}
                onChange={(e) => handleInputChange(e, setMonthlyInvestment)}
                className="h-10 pl-9 pr-3 text-right font-medium bg-primary/5 border-primary/20 text-primary rounded-lg focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary placeholder:text-primary/30"
              />
            </div>
          </div>
          <Slider
            value={[monthlyInvestment]}
            min={0}
            max={5000}
            step={50}
            onValueChange={(v) => setMonthlyInvestment(v[0])}
            className="py-2 cursor-pointer"
          />
        </div>

        {/* 4. PERÍODO */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-bold text-slate-300">Tempo de Investimento</span>
            </div>

            <div className="relative w-32">
              <Input
                type="number"
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="h-10 pl-3 pr-12 text-right font-medium bg-primary/5 border-primary/20 text-primary rounded-lg focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 mt-[2px] text-primary/70 font-medium text-xs pointer-events-none uppercase tracking-wide">
                {years === 1 ? "ano" : "anos"}
              </span>
            </div>
          </div>
          <Slider
            value={[years]}
            min={1}
            max={50}
            step={1}
            onValueChange={(v) => setYears(v[0])}
            className="py-2 cursor-pointer"
          />
        </div>
      </div>

      {/* --- COLUNA DIREITA: RESULTADOS --- */}
      <div className="lg:col-span-7 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800/40 border border-white/5 p-5 rounded-2xl flex flex-col justify-between">
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
              <Calculator className="w-3 h-3" /> Total Investido
            </p>
            <p className="text-lg md:text-xl font-bold text-slate-200">
              {formatCurrency(results.invested)}
            </p>
          </div>

          <div className="bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-2xl flex flex-col justify-between">
            <p className="text-[10px] text-emerald-400/80 font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
              <TrendingUp className="w-3 h-3" /> Juros Ganhos
            </p>
            <p className="text-lg md:text-xl font-bold text-emerald-400">
              +{formatCurrency(results.interest)}
            </p>
          </div>

          <div className="md:col-span-1 bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 p-5 rounded-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-primary/20 blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
            <div className="relative z-10">
              <p className="text-[10px] text-primary-foreground/80 font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                Total Acumulado
              </p>
              <p className="text-xl md:text-2xl font-bold text-white">
                {formatCurrency(results.total)}
              </p>
            </div>
          </div>
        </div>

        <div className="h-[350px] w-full bg-slate-950/50 rounded-2xl border border-white/5 p-4 pt-8 shadow-inner">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={results.chartData}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis
                dataKey="year"
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}a`}
              />
              <YAxis
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                width={100}
                tickFormatter={(value) =>
                  new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                    minimumFractionDigits: 0,
                  }).format(value)
                }
              />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: '#020617',
                  borderColor: '#1e293b',
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                }}
                itemStyle={{ color: '#fff', fontSize: '12px' }}
                formatter={(value: number) => [formatCurrency(value), '']}
                labelFormatter={(label) => `Ano ${label}`}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
              <Area
                type="monotone"
                dataKey="Juros Compostos"
                stroke="#3b82f6"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorTotal)"
                name="Total Acumulado"
              />
              <Area
                type="monotone"
                dataKey="Sem Juros"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="url(#colorInvested)"
                name="Total Investido"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* --- SAVE BUTTON SECTION --- */}
        <div className="flex justify-center">
          <Button
            onClick={handleSaveSimulation}
            className="gap-2"
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isSaving ? "Salvando..." : "Salvar Simulação"}
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground/60 italic">
          *Valores estimados. Rentabilidade passada não garante rentabilidade futura.
        </p>

      </div>
    </div>
  );
}
