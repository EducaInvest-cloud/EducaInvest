-- Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.tips (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.tips ENABLE ROW LEVEL SECURITY;

-- Creating policies
CREATE POLICY "Public tips are viewable by everyone" ON public.tips
    FOR SELECT USING (true);

-- Insert 50 Tips
INSERT INTO public.tips (title, content) VALUES
('O Poder do Tempo', 'Investir é plantar sementes hoje para colher uma floresta amanhã.'),
('Warren Buffett', 'Regra nº 1: Nunca perca dinheiro. Regra nº 2: Nunca esqueça a regra nº 1.'),
('Paciência', 'O mercado de ações é um dispositivo para transferir dinheiro dos impacientes para os pacientes.'),
('Juros Compostos', 'Os juros compostos são a oitava maravilha do mundo. Quem entende, ganha; quem não entende, paga.'),
('Mentalidade', 'Não trabalhe pelo dinheiro. Faça o dinheiro trabalhar por você.'),
('Risco', 'Risco vem de não saber o que você está fazendo.'),
('Longo Prazo', 'Se você não se sente confortável em possuir uma ação por 10 anos, não a possua nem por 10 minutos.'),
('Diversificação', 'Não coloque todos os seus ovos na mesma cesta.'),
('Preço vs Valor', 'Preço é o que você paga. Valor é o que você leva.'),
('Disciplina', 'A disciplina é a ponte entre metas e realizações.'),
('Gastos', 'Cuidado com as pequenas despesas; um pequeno vazamento afunda um grande navio.'),
('Reserva de Emergência', 'Imprevistos não avisam quando vão chegar. Esteja preparado.'),
('Oportunidade', 'Compre ao som dos canhões e venda ao som dos violinos.'),
('Conhecimento', 'Investir em conhecimento rende sempre os melhores juros.'),
('Benjamin Graham', 'O investidor inteligente é um realista que vende para otimistas e compra de pessimistas.'),
('Peter Lynch', 'Saiba o que você possui e saiba por que você possui.'),
('Ray Dalio', 'Quem vive de bola de cristal acaba comendo cacos de vidro.'),
('Charlie Munger', 'O dinheiro grande não está na compra e na venda, mas na espera.'),
('Foco', 'Não busque a agulha no palheiro. Apenas compre o palheiro inteiro (Índices/ETFs).'),
('Inflação', 'A inflação é o imposto silencioso que corrói o dinheiro parado.'),
('Aposentadoria', 'O melhor momento para começar a investir foi ontem. O segundo melhor é hoje.'),
('Emoções', 'Se você não consegue controlar suas emoções, não consegue controlar seu dinheiro.'),
('Simplicidade', 'Investimentos simples superam estratégias complexas na maioria das vezes.'),
('Consistência', 'Não é sobre quanto você ganha, mas sobre quanto você guarda.'),
('Liberdade', 'Dinheiro não traz felicidade, mas compra a liberdade de fazer o que te faz feliz.'),
('Ativos vs Passivos', 'Ativos colocam dinheiro no seu bolso. Passivos tiram dinheiro do seu bolso.'),
('Dívidas', 'Juros são ótimos para receber, mas terríveis para pagar.'),
('Mercado', 'O mercado é maníaco-depressivo. Não deixe o humor dele afetar o seu.'),
('Dividendos', 'Dividendos são a prova real de que uma empresa gera lucro.'),
('Ganância', 'Tenha medo quando os outros são gananciosos e seja ganancioso quando os outros têm medo.'),
('Planejamento', 'Um objetivo sem um plano é apenas um desejo.'),
('Educação', 'A maior riqueza é a sua capacidade de gerar riqueza.'),
('Hábito', 'A riqueza é o resultado de hábitos, não de sorte.'),
('Futuro', 'Você não pode prever o futuro, mas pode se preparar para ele.'),
('Fundo Imobiliário', 'Aluguel sem inquilino chato? Isso é Fundo Imobiliário.'),
('Ações', 'Você não compra um bilhete de loteria, você compra parte de um negócio.'),
('Volatilidade', 'Volatilidade não é risco. É o preço que pagamos pela rentabilidade superior.'),
('Aporte', 'O aporte mensal é o motor dos seus juros compostos.'),
('Independência', 'A verdadeira independência financeira é ser dono do seu próprio tempo.'),
('Sucesso', 'O sucesso financeiro tem mais a ver com comportamento do que com inteligência.'),
('Curto Prazo', 'No curto prazo, o mercado é uma urna de votação. No longo prazo, é uma balança.'),
('Especulação', 'Investir não é apostar. Se você busca adrenalina, vá para Vegas.'),
('Sacrifício', 'Viva como ninguém quer hoje, para viver como ninguém pode amanhã.'),
('Metas', 'Dinheiro é apenas uma ferramenta. O que importa é o que você constrói com ela.'),
('Coragem', 'É preciso coragem para ir contra a manada.'),
('Estudo', 'Analise antes de comprar. A sorte favorece a mente preparada.'),
('Sócio', 'Pense como sócio, não como trader.'),
('Impostos', 'Entenda como os impostos funcionam ou eles levarão boa parte do seu lucro.'),
('Reinvestimento', 'O segredo da bola de neve é reinvestir os dividendos.'),
('Legado', 'Construa algo que dure mais que você.');
