import { useNavigate } from 'react-router-dom';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import logo from '@/assets/logo-declara-psi.png';
import {
  Calculator, Shield, FileText, BarChart3, Clock, Users,
  ChevronRight, Check, Star, ArrowRight, Brain, Sparkles,
  MessageCircle, Phone, Mail, Instagram, Menu, X,
  ClipboardX, ClipboardCheck, NotebookPen, Zap, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { useState } from 'react';

const plans = [
  {
    name: 'Básico',
    yearlyPrice: 197,
    monthlyPrice: 217,
    priceIdYearly: 'price_basico_yearly',
    priceIdMonthly: 'price_basico_monthly',
    description: 'Para psicólogos autônomos',
    features: [
      'App completo',
      'Emissão do Receita Saúde',
      'Lançamento das despesas no Carnê Leão',
      'Emissão e envio do DARF',
      'Suporte por e-mail',
    ],
    highlighted: false,
  },
  {
    name: 'Completo',
    yearlyPrice: 247,
    monthlyPrice: 287,
    priceIdYearly: 'price_completo_yearly',
    priceIdMonthly: 'price_completo_monthly',
    description: 'O mais escolhido pelos psicólogos',
    features: [
      'Tudo do plano Básico',
      'Emissão e envio da Guia da Previdência Social (INSS) mensal',
    ],
    highlighted: true,
  },
  {
    name: 'Psi Regular',
    yearlyPrice: 367,
    monthlyPrice: null,
    priceIdYearly: 'price_psi_regular_yearly',
    priceIdMonthly: null,
    description: 'Experiência completa e sem preocupações',
    features: [
      'Tudo do plano Completo',
      'Declaração de Ajuste Anual do IRPF do ano seguinte da assinatura',
      'Atendimento via WhatsApp',
    ],
    highlighted: false,
  },
];

const benefits = [
  { icon: Calculator, title: 'Carnê-Leão Automático', description: 'Cálculo automático do imposto mensal, sem planilhas e sem erro.' },
  { icon: Shield, title: 'Segurança Total', description: 'Seus dados protegidos com criptografia de ponta a ponta.' },
  { icon: FileText, title: 'Obrigações em Dia', description: 'Nunca mais perca um prazo fiscal. Alertas e calendário integrado.' },
  { icon: BarChart3, title: 'Relatórios Inteligentes', description: 'Visualize receitas, despesas e margem de lucro em tempo real.' },
  { icon: Clock, title: 'Economia de Tempo', description: 'Automatize tarefas repetitivas e foque no que importa: seus pacientes.' },
  { icon: Users, title: 'Gestão de Pacientes', description: 'Cadastro completo com histórico financeiro de cada paciente.' },
];

const steps = [
  { number: '01', title: 'Cadastre-se', description: 'Crie sua conta em menos de 2 minutos. Sem burocracia.' },
  { number: '02', title: 'Configure', description: 'Adicione seus pacientes e despesas. Importação fácil e rápida.' },
  { number: '03', title: 'Relaxe', description: 'O sistema cuida das suas obrigações fiscais automaticamente.' },
];

const testimonials = [
  { name: 'Dra. Mariana Costa', specialty: 'Psicóloga Clínica — CRP 06/12345', quote: 'Finalmente posso focar nos meus pacientes sem me preocupar com o carnê-leão. A Declara Psi mudou minha rotina.' },
  { name: 'Dr. Rafael Oliveira', specialty: 'Neuropsicólogo — CRP 05/98765', quote: 'Antes eu gastava 4 horas por mês com planilhas. Agora é tudo automático. Recomendo para todos os colegas.' },
  { name: 'Dra. Camila Santos', specialty: 'Psicóloga Infantil — CRP 08/54321', quote: 'O suporte é incrível e o sistema é muito intuitivo. Melhor investimento que fiz para meu consultório.' },
];

const faqs = [
  { question: 'Preciso entender de contabilidade para usar?', answer: 'Não! A Declara Psi foi feita para psicólogos, não para contadores. O sistema é intuitivo e automatiza tudo que você precisa. Se tiver dúvidas, nosso suporte está sempre disponível.' },
  { question: 'Meus dados estão seguros?', answer: 'Absolutamente. Utilizamos criptografia de ponta, servidores seguros e seguimos todas as normas da LGPD. Seus dados e os de seus pacientes estão protegidos.' },
  { question: 'Posso trocar de plano depois?', answer: 'Sim! Você pode fazer upgrade ou downgrade a qualquer momento. A mudança é proporcional ao período restante.' },
  { question: 'A Declara Psi substitui meu contador?', answer: 'Trabalhamos em conjunto com seu contador. O sistema organiza e automatiza suas informações financeiras, facilitando o trabalho do seu contador e reduzindo custos.' },
  { question: 'Tem contrato de fidelidade?', answer: 'Não. Nossos planos são mensais e você pode cancelar quando quiser, sem multa ou burocracia.' },
  { question: 'Como funciona o período de teste?', answer: 'Oferecemos 7 dias gratuitos em qualquer plano, sem necessidade de cartão de crédito. Você testa tudo antes de decidir.' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<'anual' | 'mensal'>('anual');

  const handleSelectPlan = (priceId: string | null) => {
    if (!priceId) return;
    navigate('/auth');
  };

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <img src={logo} alt="Declara Psi" className="h-12" />
            
            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-8">
              {['beneficios', 'como-funciona', 'planos', 'faq'].map((id) => (
                <button key={id} onClick={() => scrollTo(id)} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors capitalize">
                  {id.replace('-', ' ')}
                </button>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Button variant="ghost" onClick={() => navigate('/auth')}>Entrar</Button>
              <Button onClick={() => scrollTo('planos')} className="bg-[hsl(184,97%,49%)] text-[hsl(221,83%,30%)] hover:bg-[hsl(184,97%,42%)] font-semibold">
                Começar Agora
              </Button>
            </div>

            {/* Mobile menu button */}
            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-background border-b border-border px-4 pb-4 space-y-3">
            {['beneficios', 'como-funciona', 'planos', 'faq'].map((id) => (
              <button key={id} onClick={() => scrollTo(id)} className="block w-full text-left py-2 text-sm font-medium text-muted-foreground capitalize">
                {id.replace('-', ' ')}
              </button>
            ))}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => navigate('/auth')}>Entrar</Button>
              <Button className="flex-1 bg-[hsl(184,97%,49%)] text-[hsl(221,83%,30%)] hover:bg-[hsl(184,97%,42%)] font-semibold" onClick={() => scrollTo('planos')}>Começar</Button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              7 dias grátis — sem cartão de crédito
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
              Contabilidade para{' '}
              <span className="text-[hsl(184,97%,49%)]">psicólogos</span>{' '}
              que querem{' '}
              <span className="bg-gradient-to-r from-primary to-[hsl(184,97%,49%)] bg-clip-text text-transparent">
                focar nos pacientes
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Chega de sistemas complexos e cheios de informação. O Declara Psi é simples, rápido e direto: automatiza seu carnê-leão, DARF e obrigações fiscais para você focar no que importa.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => scrollTo('planos')} className="bg-[hsl(184,97%,49%)] text-[hsl(221,83%,30%)] hover:bg-[hsl(184,97%,42%)] font-semibold text-base px-8 h-12">
                Começar Gratuitamente <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => scrollTo('como-funciona')} className="text-base px-8 h-12">
                Como Funciona
              </Button>
            </div>
          </div>

          {/* Social proof counter */}
          <div className="mt-16 flex flex-wrap justify-center gap-8 sm:gap-16 text-center">
            {[
              { value: '500+', label: 'Psicólogos ativos' },
              { value: 'R$ 2M+', label: 'Gerenciados por mês' },
              { value: '99.9%', label: 'Uptime garantido' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl sm:text-4xl font-extrabold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Receita Saúde Pain Point */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-5 px-4 py-1.5 text-sm font-medium">
              <Zap className="h-3.5 w-3.5 mr-1.5" />
              A maior dor resolvida
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Nunca mais copie CPF de caderninho para o{' '}
              <span className="text-[hsl(var(--primary))]">Receita Saúde</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Seus pacientes ficam cadastrados. Nós emitimos o Receita Saúde para você — sem planilha, sem erro, sem estresse.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                beforeIcon: NotebookPen,
                beforeText: 'Caderninho com CPFs e valores',
                afterIcon: ClipboardCheck,
                afterText: 'Pacientes cadastrados no app',
              },
              {
                beforeIcon: ClipboardX,
                beforeText: 'Copiar e colar no Receita Saúde',
                afterIcon: Zap,
                afterText: 'Emissão automática por nós',
              },
              {
                beforeIcon: AlertTriangle,
                beforeText: 'Medo de errar dados fiscais',
                afterIcon: ShieldCheck,
                afterText: 'Tudo conferido pela nossa equipe',
              },
            ].map((item, i) => (
              <Card key={i} className="border-0 shadow-md overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-5 bg-destructive/5 border-b border-destructive/10">
                    <div className="flex items-center gap-2 text-xs font-semibold text-destructive mb-3 uppercase tracking-wide">
                      <X className="h-3.5 w-3.5" /> Antes
                    </div>
                    <div className="flex items-start gap-3">
                      <item.beforeIcon className="h-5 w-5 text-destructive/60 mt-0.5 shrink-0" />
                      <span className="text-sm text-muted-foreground">{item.beforeText}</span>
                    </div>
                  </div>
                  <div className="p-5 bg-[hsl(184,97%,49%)]/5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[hsl(184,97%,40%)] mb-3 uppercase tracking-wide">
                      <Check className="h-3.5 w-3.5" /> Depois
                    </div>
                    <div className="flex items-start gap-3">
                      <item.afterIcon className="h-5 w-5 text-[hsl(184,97%,40%)] mt-0.5 shrink-0" />
                      <span className="text-sm font-medium">{item.afterText}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-10">
            <Button size="lg" onClick={() => scrollTo('planos')} className="bg-[hsl(184,97%,49%)] text-[hsl(221,83%,30%)] hover:bg-[hsl(184,97%,42%)] font-semibold text-base px-8 h-12">
              Quero parar de sofrer com planilhas <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="beneficios" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Tudo que você precisa em um só lugar</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Desenvolvido por contadores especializados em profissionais da saúde mental.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b) => (
              <Card key={b.title} className="border-0 shadow-md hover:shadow-lg transition-shadow bg-card">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <b.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{b.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{b.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Simples como deve ser</h2>
            <p className="text-muted-foreground text-lg">Comece a usar em minutos, não em dias.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <div key={s.number} className="text-center relative">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%] border-t-2 border-dashed border-border" />
                )}
                <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-primary text-primary-foreground text-2xl font-bold mb-5">
                  {s.number}
                </div>
                <h3 className="font-semibold text-xl mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-sm">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="planos" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Planos que cabem no seu bolso</h2>
            <p className="text-muted-foreground text-lg mb-8">7 dias grátis em qualquer plano. Cancele quando quiser.</p>
            <div className="flex items-center justify-center gap-3 mb-10">
              <span className={`text-sm font-medium ${billingPeriod === 'mensal' ? 'text-foreground' : 'text-muted-foreground'}`}>Mensal</span>
              <Switch checked={billingPeriod === 'anual'} onCheckedChange={(checked) => setBillingPeriod(checked ? 'anual' : 'mensal')} />
              <span className={`text-sm font-medium ${billingPeriod === 'anual' ? 'text-foreground' : 'text-muted-foreground'}`}>Anual</span>
              {billingPeriod === 'anual' && (
                <Badge variant="secondary" className="text-xs">Economia</Badge>
              )}
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => {
              const price = billingPeriod === 'anual' ? plan.yearlyPrice : plan.monthlyPrice;
              const priceId = billingPeriod === 'anual' ? plan.priceIdYearly : plan.priceIdMonthly;
              const isUnavailable = price === null;

              return (
                <Card
                  key={plan.name}
                  className={`relative flex flex-col border-2 transition-all ${
                    plan.highlighted
                      ? 'border-[hsl(184,97%,49%)] shadow-xl scale-[1.02]'
                      : 'border-border hover:border-primary/30 shadow-md'
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <Badge className="bg-[hsl(184,97%,49%)] text-[hsl(221,83%,30%)] font-semibold px-4 py-1">
                        <Star className="h-3.5 w-3.5 mr-1" /> Mais Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-2 pt-8">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </CardHeader>
                  <CardContent className="flex flex-col flex-1 pt-4">
                    <div className="text-center mb-6 h-12 flex items-center justify-center">
                      {isUnavailable ? (
                        <span className="text-lg font-semibold text-muted-foreground">Indisponível no plano mensal</span>
                      ) : (
                        <>
                          <span className="text-4xl font-extrabold">R$ {price}</span>
                          <span className="text-muted-foreground">/mês</span>
                        </>
                      )}
                    </div>
                    <ul className="space-y-3 flex-1 mb-6">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-sm">
                          <Check className="h-4 w-4 text-[hsl(184,97%,49%)] mt-0.5 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full h-11 font-semibold ${
                        plan.highlighted
                          ? 'bg-[hsl(184,97%,49%)] text-[hsl(221,83%,30%)] hover:bg-[hsl(184,97%,42%)]'
                          : ''
                      }`}
                      variant={plan.highlighted ? 'default' : 'outline'}
                      disabled={isUnavailable}
                      onClick={() => handleSelectPlan(priceId)}
                    >
                      {isUnavailable ? 'Apenas no plano anual' : 'Começar Agora'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">O que dizem nossos clientes</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <Card key={t.name} className="border-0 shadow-md">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-[hsl(43,96%,56%)] text-[hsl(43,96%,56%)]" />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed mb-5 italic text-muted-foreground">"{t.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Brain className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.specialty}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Perguntas Frequentes</h2>
          </div>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="bg-card rounded-lg border px-4">
                <AccordionTrigger className="text-left text-sm font-medium hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Pronto para simplificar sua contabilidade?</h2>
          <p className="text-muted-foreground text-lg mb-8">Junte-se a mais de 500 psicólogos que já confiam na Declara Psi.</p>
          <Button size="lg" onClick={() => scrollTo('planos')} className="bg-[hsl(184,97%,49%)] text-[hsl(221,83%,30%)] hover:bg-[hsl(184,97%,42%)] font-semibold text-base px-10 h-12">
            Começar Meus 7 Dias Grátis <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <img src={logo} alt="Declara Psi" className="h-10 mb-4 brightness-0 invert" />
              <p className="text-sm opacity-70">Contabilidade inteligente para profissionais da psicologia.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Produto</h4>
              <ul className="space-y-2 text-sm opacity-70">
                <li><button onClick={() => scrollTo('beneficios')} className="hover:opacity-100 transition-opacity">Benefícios</button></li>
                <li><button onClick={() => scrollTo('planos')} className="hover:opacity-100 transition-opacity">Planos</button></li>
                <li><button onClick={() => scrollTo('faq')} className="hover:opacity-100 transition-opacity">FAQ</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-sm opacity-70">
                <li><span>Termos de Uso</span></li>
                <li><span>Política de Privacidade</span></li>
                <li><span>LGPD</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Contato</h4>
              <ul className="space-y-2 text-sm opacity-70">
                <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> contato@declarapsi.com.br</li>
                <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> (11) 99999-9999</li>
                <li className="flex items-center gap-2"><Instagram className="h-4 w-4" /> @declarapsi</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-primary-foreground/20 pt-6 text-center text-sm opacity-60">
            © {new Date().getFullYear()} Declara Psi. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
