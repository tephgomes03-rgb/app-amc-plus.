import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, Target, CheckCircle, XCircle, Star, Calendar, BarChart2, User, Award, TrendingUp, Clock, Menu, X, Sparkles, LoaderCircle, LogOut, Mail, Lock, UserPlus } from 'lucide-react';

// --- Imports do Firebase ---
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    signInAnonymously,
    signInWithCustomToken
} from 'firebase/auth';
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc,
    onSnapshot
} from 'firebase/firestore';


// --- Configuração do Firebase ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- MOCK DATA INICIAL (para novos usuários) ---
const initialUserDataTemplate = {
  nome: "Novo Aluno",
  pontos: 0,
  conquistas: ["Iniciante nos Estudos"],
  desempenho: {
    matematica: { acertos: 0, total: 0 },
    biologia: { acertos: 0, total: 0 },
    historia: { acertos: 0, total: 0 },
    portugues: { acertos: 0, total: 0 },
    direitoAdministrativo: { acertos: 0, total: 0 }
  }
};

const initialMockQuestoes = {
  matematica: [{ id: 1, pergunta: "Qual é o valor de 7 x 8?", opcoes: ["54", "56", "62", "64"], respostaCorreta: "56", explicacao: "A multiplicação de 7 por 8 resulta em 56." }],
  biologia: [{ id: 3, pergunta: "Qual organela é responsável pela respiração celular?", opcoes: ["Ribossomo", "Lisossomo", "Mitocôndria"], respostaCorreta: "Mitocôndria", explicacao: "As mitocôndrias são as 'usinas de energia' da célula." }],
  historia: [{ id: 4, pergunta: "Em que ano o Brasil se tornou uma república?", opcoes: ["1822", "1889", "1930"], respostaCorreta: "1889", explicacao: "A Proclamação da República ocorreu em 15 de novembro de 1889." }],
  portugues: [{ id: 5, pergunta: "Qual figura de linguagem está em 'Choveram propostas'?", opcoes: ["Metáfora", "Hipérbole"], respostaCorreta: "Hipérbole", explicacao: "Hipérbole é o exagero intencional." }],
  direitoAdministrativo: [{ id: 6, pergunta: "Qual princípio NÃO está expresso no Art. 37 da CF?", opcoes: ["Legalidade", "Razoabilidade"], respostaCorreta: "Razoabilidade", explicacao: "O mnemônico é LIMPE (Legalidade, Impessoalidade, Moralidade, Publicidade e Eficiência)." }],
  quimica: [{ id: 7, pergunta: "Qual o número de mols em 36g de H₂O? (Dados: H=1, O=16)", opcoes: ["1 mol", "2 mols", "3 mols", "4 mols"], respostaCorreta: "2 mols", explicacao: "A massa molar da água (H₂O) é 1*2 + 16 = 18 g/mol. Portanto, 36g / 18 g/mol = 2 mols." }],
  fisica: [{ id: 8, pergunta: "Qual é a Segunda Lei de Newton?", opcoes: ["Princípio da Inércia", "Princípio Fundamental da Dinâmica", "Princípio da Ação e Reação", "Lei da Gravitação Universal"], respostaCorreta: "Princípio Fundamental da Dinâmica", explicacao: "A Segunda Lei de Newton (F = m*a) é o Princípio Fundamental da Dinâmica." }],
  geografia: [{ id: 9, pergunta: "Qual bioma brasileiro é conhecido como a savana mais rica em biodiversidade do mundo?", opcoes: ["Amazônia", "Mata Atlântica", "Cerrado", "Pampa"], respostaCorreta: "Cerrado", explicacao: "O Cerrado é considerado a savana com a maior biodiversidade do planeta." }],
  filosofia: [{ id: 10, pergunta: "Para qual filósofo o mundo sensível é uma cópia imperfeita do mundo das ideias?", opcoes: ["Aristóteles", "Sócrates", "Platão", "Heráclito"], respostaCorreta: "Platão", explicacao: "Esta é a base da Teoria das Ideias (ou Formas) de Platão." }],
  sociologia: [{ id: 11, pergunta: "O conceito de 'Fato Social' foi cunhado por qual sociólogo?", opcoes: ["Karl Marx", "Max Weber", "Auguste Comte", "Émile Durkheim"], respostaCorreta: "Émile Durkheim", explicacao: "Durkheim definiu o Fato Social como o objeto de estudo da Sociologia." }],
  redacao: [{ id: 12, pergunta: "Na estrutura do texto dissertativo-argumentativo do ENEM, qual parte deve conter a tese?", opcoes: ["Introdução", "Desenvolvimento 1", "Desenvolvimento 2", "Conclusão"], respostaCorreta: "Introdução", explicacao: "A tese, ou ponto de vista a ser defendido, deve ser apresentada claramente na introdução." }],
  ingles: [{ id: 13, pergunta: "In the sentence 'She has been studying for hours', what tense is used?", opcoes: ["Simple Present", "Present Perfect Continuous", "Past Perfect", "Future Perfect"], respostaCorreta: "Present Perfect Continuous", explicacao: "This tense is used for an action that started in the past and is still ongoing." }],
  espanhol: [{ id: 14, pergunta: "Qué significa la palabra 'ordenador' en español de España?", opcoes: ["Mesa", "Caneta", "Computador", "Professor"], respostaCorreta: "Computador", explicacao: "'Ordenador' é o termo usado na Espanha para computador. Na América Latina, usa-se 'computadora'." }]
};

const mockResumos = [
  { id: 1, materia: "Biologia", titulo: "Ciclo Celular", conteudo: "O ciclo celular é o processo de vida de uma célula." },
  { id: 2, materia: "História", titulo: "Revolução Francesa", conteudo: "Movimento social e político de 1789 que derrubou o Antigo Regime." },
  { id: 3, materia: "Direito Administrativo", titulo: "Atos Administrativos", conteudo: "Manifestação unilateral de vontade da Administração Pública." },
  { id: 4, materia: "Química", titulo: "Modelos Atômicos", conteudo: "A evolução dos modelos atômicos passou por Dalton (esfera maciça), Thomson (pudim de passas), Rutherford (sistema solar) e Bohr (níveis de energia)." },
  { id: 5, materia: "Física", titulo: "Leis de Newton", conteudo: "As três leis de Newton são: 1ª Lei (Inércia), 2ª Lei (F=ma) e 3ª Lei (Ação e Reação)." },
  { id: 6, materia: "Geografia", titulo: "Globalização", conteudo: "Processo de integração econômica, social, cultural e política, impulsionado pela tecnologia da informação e transportes." },
  { id: 7, materia: "Filosofia", titulo: "Sócrates", conteudo: "Filósofo grego conhecido pelo método socrático (maiêutica) e pela frase 'Só sei que nada sei'. Foco na ética e no autoconhecimento." },
  { id: 8, materia: "Sociologia", titulo: "Max Weber", conteudo: "Sociólogo alemão que analisou a ação social, a burocracia e a relação entre a ética protestante e o capitalismo." },
  { id: 9, materia: "Redação", titulo: "Estrutura ENEM", conteudo: "A redação do ENEM exige um texto dissertativo-argumentativo com: Introdução (tese), Desenvolvimento (argumentos) e Conclusão (proposta de intervenção)." },
  { id: 10, materia: "Inglês", titulo: "Simple Present", conteudo: "Usado para hábitos, rotinas e fatos universais. Ex: 'The Earth revolves around the Sun.'." },
  { id: 11, materia: "Espanhol", titulo: "Verbos Ser y Estar", conteudo: "'Ser' é usado para características permanentes e essenciais. 'Estar' é usado para estados temporários e localização." },
  { id: 12, materia: "Vade Mecum", titulo: "O que é Vade Mecum?", conteudo: "É uma compilação de legislação essencial para estudantes e profissionais do Direito. Indispensável para concursos públicos da área jurídica, inclui a Constituição Federal, Códigos, Leis e Súmulas." }
];

const mockDicas = [
  { id: 1, titulo: "Técnica Pomodoro", descricao: "Estude focado por 25 minutos e faça uma pausa de 5 minutos." },
  { id: 2, titulo: "Mapas Mentais", descricao: "Crie diagramas visuais para conectar informações." },
];

const subjectsByMode = {
    vestibular: ['matematica', 'quimica', 'fisica', 'biologia', 'historia', 'geografia', 'filosofia', 'sociologia', 'portugues', 'redacao', 'ingles', 'espanhol'],
    concurso: ['direitoAdministrativo', 'portugues']
};

// --- COMPONENTES ---

const AppIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const Header = ({ setScreen, isMenuOpen, setIsMenuOpen, handleLogout, user }) => (
  <header className="bg-white shadow-md sticky top-0 z-20">
    <div className="container mx-auto px-4 py-3 flex justify-between items-center">
      <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setScreen('dashboard')}>
        <div className="bg-blue-500 p-1 rounded-lg"><AppIcon /></div>
        <h1 className="text-2xl font-bold text-blue-500">AMC+</h1>
      </div>
      <nav className="hidden md:flex items-center space-x-6">
        <NavItem text="Questões" onClick={() => setScreen('questoes')} />
        <NavItem text="Resumos" onClick={() => setScreen('resumos')} />
        <NavItem text="Dicas" onClick={() => setScreen('dicas')} />
        <NavItem text="Cronograma" onClick={() => setScreen('cronograma')} />
      </nav>
      <div className="flex items-center space-x-4">
        <div className="hidden md:block p-2 rounded-full bg-gray-100 hover:bg-gray-200 cursor-pointer" onClick={() => setScreen('perfil')}>
          <User className="text-gray-600" />
        </div>
        {user && (
            <button onClick={handleLogout} className="hidden md:flex items-center gap-2 text-gray-600 hover:text-red-500 transition-colors">
                <LogOut size={20} />
                <span>Sair</span>
            </button>
        )}
        <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>
    </div>
    {isMenuOpen && (
       <div className="md:hidden bg-white py-4 px-4 border-t">
          <NavItemMobile text="Questões" onClick={() => { setScreen('questoes'); setIsMenuOpen(false); }} />
          <NavItemMobile text="Resumos" onClick={() => { setScreen('resumos'); setIsMenuOpen(false); }} />
          <NavItemMobile text="Dicas" onClick={() => { setScreen('dicas'); setIsMenuOpen(false); }} />
          <NavItemMobile text="Cronograma" onClick={() => { setScreen('cronograma'); setIsMenuOpen(false); }} />
          <NavItemMobile text="Meu Perfil" onClick={() => { setScreen('perfil'); setIsMenuOpen(false); }} />
          <hr className="my-2"/>
          {user && (
            <button onClick={handleLogout} className="w-full flex items-center space-x-3 text-red-600 p-3 rounded-lg hover:bg-red-50 transition-colors duration-200">
                <LogOut size={20} />
                <span className="font-semibold text-lg">Sair</span>
            </button>
          )}
       </div>
    )}
  </header>
);

const NavItem = ({ text, onClick }) => (
  <button onClick={onClick} className="flex items-center space-x-2 text-gray-600 hover:text-blue-500 transition-colors"><span className="font-medium">{text}</span></button>
);
const NavItemMobile = ({ text, onClick }) => (
    <button onClick={onClick} className="w-full flex items-center space-x-3 text-gray-700 p-3 rounded-lg hover:bg-blue-50"><span className="font-semibold text-lg">{text}</span></button>
);

const Dashboard = ({ setScreen, userData, studyMode, setStudyMode }) => (
  <div className="space-y-8">
    <div className="bg-blue-500 text-white p-8 rounded-2xl shadow-lg">
      <h2 className="text-3xl md:text-4xl font-bold mb-4">Olá, {userData?.nome || 'Estudante'}!</h2>
      <p className="text-lg text-blue-100 mb-6">Selecione seu foco de estudo para começar.</p>
      <div className="flex bg-blue-400 p-1 rounded-full max-w-md">
          <button onClick={() => setStudyMode('vestibular')} className={`w-1/2 py-2 rounded-full font-semibold transition-colors ${studyMode === 'vestibular' ? 'bg-white text-blue-600 shadow' : 'text-white'}`}>Vestibular/ENEM</button>
          <button onClick={() => setStudyMode('concurso')} className={`w-1/2 py-2 rounded-full font-semibold transition-colors ${studyMode === 'concurso' ? 'bg-white text-blue-600 shadow' : 'text-white'}`}>Concursos Públicos</button>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <DashboardCard title="Banco de Questões" onClick={() => setScreen('questoes')} />
      <DashboardCard title="Resumos" onClick={() => setScreen('resumos')} />
      <DashboardCard title="Dicas de Estudo" onClick={() => setScreen('dicas')} />
      <DashboardCard title="Meu Desempenho" onClick={() => setScreen('perfil')} />
    </div>
  </div>
);

const DashboardCard = ({ title, onClick }) => (
    <div onClick={onClick} className="p-6 bg-white rounded-2xl shadow-sm cursor-pointer transition-all duration-300 transform hover:-translate-y-1 border-2 hover:border-blue-300">
        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
    </div>
);

// --- TELA DE LOGIN E CADASTRO ---
const AuthScreen = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAuthAction = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                const userDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/profile/data`);
                await setDoc(userDocRef, { ...initialUserDataTemplate, nome: name, email: user.email });
            }
        } catch (err) {
            console.error("Auth Error:", err.code, err.message);
            if (err.code === 'auth/weak-password') {
                setError('A senha deve ter pelo menos 6 caracteres.');
            } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                setError('Email ou senha inválidos.');
            } else if (err.code === 'auth/email-already-in-use') {
                setError('Este email já está cadastrado.');
            } else if (err.code === 'auth/operation-not-allowed') {
                setError('Login com Email/Senha não habilitado para este projeto.');
            } else {
                setError('Ocorreu um erro. Tente novamente.');
            }
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
            <div className="max-w-md w-full mx-auto">
                <div className="flex items-center justify-center space-x-3 mb-8">
                    <div className="bg-blue-500 p-2 rounded-xl"><AppIcon /></div>
                    <h1 className="text-4xl font-bold text-blue-500">AMC+</h1>
                </div>
                <div className="bg-white p-8 rounded-2xl shadow-lg">
                    <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">{isLogin ? 'Bem-vindo de volta!' : 'Crie sua conta'}</h2>
                    <p className="text-center text-gray-500 mb-6">{isLogin ? 'Faça login para continuar' : 'Comece sua jornada de estudos'}</p>
                    <form onSubmit={handleAuthAction} className="space-y-4">
                        {!isLogin && (
                             <div className="relative">
                                <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input type="text" placeholder="Nome Completo" value={name} onChange={e => setName(e.target.value)} required className="w-full p-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                             </div>
                        )}
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} required className="w-full p-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                        </div>
                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        <button type="submit" disabled={loading} className="w-full bg-blue-500 text-white font-bold py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300 flex items-center justify-center">
                            {loading ? <LoaderCircle className="animate-spin" /> : (isLogin ? 'Entrar' : 'Cadastrar')}
                        </button>
                    </form>
                    <p className="text-center text-sm text-gray-600 mt-6">
                        {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
                        <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="font-semibold text-blue-500 hover:underline ml-1">
                            {isLogin ? 'Cadastre-se' : 'Faça login'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};


// --- COMPONENTES DAS TELAS INTERNAS (Funcionalidades Completas) ---

const QuestionBank = ({ studyMode }) => {
  const [allQuestions, setAllQuestions] = useState(initialMockQuestoes);
  const availableSubjects = useMemo(() => subjectsByMode[studyMode], [studyMode]);
  const [materiaSelecionada, setMateriaSelecionada] = useState(availableSubjects[0]);
  const [questaoAtual, setQuestaoAtual] = useState(0);
  const [respostaSelecionada, setRespostaSelecionada] = useState(null);
  const [mostrarFeedback, setMostrarFeedback] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);

  useEffect(() => {
    setMateriaSelecionada(availableSubjects[0]);
    setQuestaoAtual(0);
    setRespostaSelecionada(null);
    setMostrarFeedback(false);
    setShowCompletionMessage(false);
  }, [studyMode, availableSubjects]);

  const questoes = allQuestions[materiaSelecionada] || [];
  const questao = questoes[questaoAtual];
  
  const handleSelectMateria = (materia) => {
    setMateriaSelecionada(materia);
    setQuestaoAtual(0);
    setRespostaSelecionada(null);
    setMostrarFeedback(false);
    setShowCompletionMessage(false);
  }

  const handleResponder = () => {
    if (respostaSelecionada === null) return;
    setMostrarFeedback(true);
  };
  
  const handleProxima = () => {
    setMostrarFeedback(false);
    setRespostaSelecionada(null);
    if (questaoAtual < questoes.length - 1) {
      setQuestaoAtual(questaoAtual + 1);
    } else {
      setShowCompletionMessage(true);
    }
  }

  const generateNewQuestion = async () => {
    setIsLoading(true);
    setShowCompletionMessage(false);
    const prompt = `Crie uma questão de múltipla escolha, nível ${studyMode === 'vestibular' ? 'ENEM' : 'concurso público'}, sobre ${materiaSelecionada}. A questão deve ser única e não trivial. Forneça 4 opções de resposta.`;
    const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
    const payload = {
      contents: chatHistory,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: { pergunta: { type: "STRING" }, opcoes: { type: "ARRAY", items: { type: "STRING" } }, respostaCorreta: { type: "STRING" }, explicacao: { type: "STRING" } },
          required: ["pergunta", "opcoes", "respostaCorreta", "explicacao"]
        }
      }
    };
    try {
      let response;
      let retries = 3;
      let delay = 1000;
      while (retries > 0) {
        const apiKey = "";
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
        response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (response.ok) break;
        retries--;
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
      }
      if (!response.ok) throw new Error("Falha ao gerar questão.");
      const result = await response.json();
      const newQuestion = JSON.parse(result.candidates[0].content.parts[0].text);
      setAllQuestions(prev => ({ ...prev, [materiaSelecionada]: [...(prev[materiaSelecionada] || []), { ...newQuestion, id: Date.now() }] }));
      setQuestaoAtual((allQuestions[materiaSelecionada] || []).length);
    } catch (error) { console.error("Erro ao gerar nova questão:", error); } finally { setIsLoading(false); }
  };

  const getOptionClasses = (opcao) => {
    if (!mostrarFeedback) return respostaSelecionada === opcao ? 'bg-blue-200 border-blue-500' : 'bg-white hover:bg-gray-100 border-gray-300';
    const isCorrect = opcao === questao.respostaCorreta;
    const isSelected = opcao === respostaSelecionada;
    if (isCorrect) return 'bg-green-200 border-green-500';
    if (isSelected && !isCorrect) return 'bg-red-200 border-red-500';
    return 'bg-white border-gray-300';
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-3xl font-bold text-gray-800">Banco de Questões</h2>
        <button onClick={generateNewQuestion} disabled={isLoading} className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-400 to-orange-500 text-white font-bold py-2 px-4 rounded-lg hover:from-orange-500 hover:to-orange-600 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
          {isLoading ? <LoaderCircle className="animate-spin" /> : <Sparkles size={20} />}
          <span>Gerar Nova Questão ✨</span>
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {availableSubjects.map(materia => (
          <button key={materia} onClick={() => handleSelectMateria(materia)} className={`px-4 py-2 rounded-full font-semibold transition-colors capitalize ${materiaSelecionada === materia ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
            {materia.replace(/([A-Z])/g, ' $1')}
          </button>
        ))}
      </div>
      {showCompletionMessage ? (
        <div className="bg-white p-8 text-center rounded-2xl shadow-md">
            <h3 className="text-2xl font-bold text-green-600 mb-2">Parabéns!</h3>
            <p className="text-gray-700 mb-6">Você concluiu todas as questões de {materiaSelecionada.replace(/([A-Z])/g, ' $1')}.</p>
            <button onClick={generateNewQuestion} disabled={isLoading} className="flex items-center justify-center gap-2 mx-auto bg-orange-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50">
               {isLoading ? <LoaderCircle className="animate-spin" /> : <Sparkles size={20} />}
               <span>Que tal uma nova questão?</span>
            </button>
        </div>
      ) : !questao ? (
        <div className="bg-white p-8 text-center rounded-2xl shadow-md">
            <p className="text-gray-700">Nenhuma questão encontrada para esta matéria. Tente gerar uma nova!</p>
        </div>
      ) : (
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-md">
          <p className="text-sm font-semibold text-blue-500 mb-2">Questão {questaoAtual + 1} de {questoes.length}</p>
          <p className="text-lg text-gray-800 mb-6">{questao.pergunta}</p>
          <div className="space-y-4">
            {questao.opcoes.map(opcao => (
              <button key={opcao} onClick={() => !mostrarFeedback && setRespostaSelecionada(opcao)} className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${getOptionClasses(opcao)}`} disabled={mostrarFeedback}>
                {opcao}
              </button>
            ))}
          </div>
          {mostrarFeedback && (
            <div className={`mt-6 p-4 rounded-lg ${respostaSelecionada === questao.respostaCorreta ? 'bg-green-100' : 'bg-red-100'}`}>
              <div className="flex items-start space-x-3">
                {respostaSelecionada === questao.respostaCorreta ? <CheckCircle className="text-green-600 mt-1 flex-shrink-0" /> : <XCircle className="text-red-600 mt-1 flex-shrink-0" />}
                <div>
                  <h4 className="font-bold text-lg">{respostaSelecionada === questao.respostaCorreta ? 'Resposta Correta!' : 'Resposta Incorreta!'}</h4>
                  <p className="text-gray-700">{questao.explicacao}</p>
                </div>
              </div>
            </div>
          )}
          <div className="mt-8 text-right">
            {mostrarFeedback ? (
              <button onClick={handleProxima} className="bg-blue-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-600 transition-colors">Próxima Questão</button>
            ) : (
              <button onClick={handleResponder} disabled={respostaSelecionada === null} className="bg-blue-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300">Responder</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const Summaries = ({ studyMode }) => {
  const [topic, setTopic] = useState('');
  const [generatedSummary, setGeneratedSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const resumosFiltrados = useMemo(() => {
    const subjectsForMode = subjectsByMode[studyMode];
    let filtered = mockResumos.filter(r => subjectsForMode.includes(r.materia.toLowerCase().replace(/\s/g, '')));
    if (studyMode === 'concurso') {
        const vadeMecum = mockResumos.find(r => r.materia === 'Vade Mecum');
        if (vadeMecum) {
            filtered.push(vadeMecum);
        }
    }
    return filtered;
  }, [studyMode]);

  const handleGenerateSummary = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setIsLoading(true);
    setGeneratedSummary(null);
    const prompt = `Crie um resumo conciso e objetivo, em português, para um estudante de ${studyMode === 'vestibular' ? 'vestibular' : 'concurso público'} sobre o seguinte tópico: "${topic}". O resumo deve ser direto e focar nos pontos mais importantes.`;
    const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
    const payload = { contents: chatHistory };
    try {
      let response;
      let retries = 3;
      let delay = 1000;
      while (retries > 0) {
        const apiKey = "";
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
        response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (response.ok) break;
        retries--;
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
      }
      if (!response.ok) throw new Error("Falha ao gerar resumo.");
      const result = await response.json();
      const text = result.candidates[0].content.parts[0].text;
      setGeneratedSummary({ titulo: topic, conteudo: text });
    } catch (error) {
      console.error("Erro ao gerar resumo:", error);
      setGeneratedSummary({ titulo: "Erro", conteudo: "Não foi possível gerar o resumo. Tente novamente." });
    } finally { setIsLoading(false); }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">Resumos por Matéria</h2>
      <div className="bg-white p-6 rounded-2xl shadow-md border-2 border-dashed border-blue-300">
        <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2"><Sparkles className="text-blue-500" />Precisa de um resumo rápido?</h3>
        <p className="text-gray-600 mb-4">Digite o tópico abaixo e deixe a IA criar um resumo para você!</p>
        <form onSubmit={handleGenerateSummary} className="flex flex-col sm:flex-row gap-2">
          <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Ex: Segunda Guerra Mundial" className="flex-grow p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={isLoading} />
          <button type="submit" disabled={isLoading || !topic.trim()} className="flex items-center justify-center gap-2 bg-blue-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300">
            {isLoading ? <LoaderCircle className="animate-spin" /> : 'Gerar Resumo ✨'}
          </button>
        </form>
        {generatedSummary && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-bold text-lg text-blue-800 capitalize">{generatedSummary.titulo}</h4>
            <p className="text-blue-900 whitespace-pre-wrap">{generatedSummary.conteudo}</p>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resumosFiltrados.map(resumo => (
          <div key={resumo.id} className="bg-white p-6 rounded-2xl shadow-md flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-sm font-bold text-blue-500">{resumo.materia}</p>
                <h3 className="text-xl font-bold text-gray-800">{resumo.titulo}</h3>
              </div>
              <button className="p-2 -mr-2 -mt-2"><Star className="text-gray-400" /></button>
            </div>
            <p className="text-gray-600 flex-grow">{resumo.conteudo}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const StudyTips = () => (
    <div className="space-y-6">
        <h2 className="text-3xl font-bold text-gray-800">Dicas de Estudo</h2>
        <p className="text-lg text-gray-600">Otimize seu aprendizado com técnicas e estratégias comprovadas.</p>
        <div className="space-y-4">
            {mockDicas.map(dica => (
                <div key={dica.id} className="bg-white p-6 rounded-2xl shadow-md">
                    <h3 className="text-xl font-bold text-blue-500 mb-2">{dica.titulo}</h3>
                    <p className="text-gray-700">{dica.descricao}</p>
                </div>
            ))}
        </div>
    </div>
);

const Schedule = ({ studyMode }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [generatedPlan, setGeneratedPlan] = useState({});
    
    const [examDate, setExamDate] = useState('');
    const [studyHours, setStudyHours] = useState(4);
    const [priorities, setPriorities] = useState([]);

    const availableSubjects = subjectsByMode[studyMode];

    const handlePriorityChange = (subject) => {
        setPriorities(prev => prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]);
    };

    const handleGeneratePlan = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const prompt = `Crie um cronograma de estudos semanal para um estudante de ${studyMode === 'vestibular' ? 'vestibular/ENEM' : 'concurso público'}.
        Data da prova: ${examDate || 'não definida'}.
        Horas de estudo por dia: ${studyHours}.
        Matérias prioritárias: ${priorities.join(', ') || 'nenhuma'}.
        Matérias disponíveis: ${availableSubjects.join(', ')}.
        O cronograma deve ser balanceado, incluindo revisões e pausas. Distribua as matérias ao longo da semana (de segunda a sábado).`;

        const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
        const payload = {
            contents: chatHistory,
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        segunda: { type: "ARRAY", items: { type: "OBJECT", properties: { time: { type: "STRING" }, subject: { type: "STRING" }, task: { type: "STRING" } } } },
                        terca: { type: "ARRAY", items: { type: "OBJECT", properties: { time: { type: "STRING" }, subject: { type: "STRING" }, task: { type: "STRING" } } } },
                        quarta: { type: "ARRAY", items: { type: "OBJECT", properties: { time: { type: "STRING" }, subject: { type: "STRING" }, task: { type: "STRING" } } } },
                        quinta: { type: "ARRAY", items: { type: "OBJECT", properties: { time: { type: "STRING" }, subject: { type: "STRING" }, task: { type: "STRING" } } } },
                        sexta: { type: "ARRAY", items: { type: "OBJECT", properties: { time: { type: "STRING" }, subject: { type: "STRING" }, task: { type: "STRING" } } } },
                        sabado: { type: "ARRAY", items: { type: "OBJECT", properties: { time: { type: "STRING" }, subject: { type: "STRING" }, task: { type: "STRING" } } } }
                    }
                }
            }
        };

        try {
            let response;
            let retries = 3;
            let delay = 1000;
            while (retries > 0) {
                const apiKey = "";
                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
                response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                if (response.ok) break;
                retries--;
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2;
            }
            if (!response.ok) throw new Error("Falha ao gerar plano.");
            const result = await response.json();
            const plan = JSON.parse(result.candidates[0].content.parts[0].text);
            setGeneratedPlan(plan);
            setIsModalOpen(false);
        } catch (error) {
            console.error("Erro ao gerar plano:", error);
        } finally {
            setIsLoading(false);
        }
    };
    
    const diasDaSemana = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];
    const subjectColors = {
        default: 'bg-gray-400',
        matematica: 'bg-blue-500',
        biologia: 'bg-green-500',
        historia: 'bg-red-500',
        portugues: 'bg-yellow-500',
        direitoAdministrativo: 'bg-purple-500'
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h2 className="text-3xl font-bold text-gray-800">Cronograma Inteligente</h2>
                <button onClick={() => setIsModalOpen(true)} className="flex items-center justify-center gap-2 bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors shadow-md">
                    <Sparkles size={20} />
                    Planejamento Automático
                </button>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
                    {diasDaSemana.map(dia => (
                        <div key={dia} className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-bold text-lg text-center capitalize mb-4">{dia}</h3>
                            <div className="space-y-3">
                                {generatedPlan[dia] && generatedPlan[dia].length > 0 ? (
                                    generatedPlan[dia].map((evento, index) => (
                                        <div key={index} className="p-3 rounded-lg bg-white border-l-4" style={{ borderColor: subjectColors[evento.subject.toLowerCase().replace(/\s/g, '')] || subjectColors.default }}>
                                            <p className="font-semibold text-sm text-gray-500">{evento.time}</p>
                                            <p className="font-bold text-gray-800">{evento.subject}</p>
                                            <p className="text-sm text-gray-600">{evento.task}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-400 text-center">{dia === 'domingo' ? 'Descanso! 🌴' : 'Nenhuma tarefa.'}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30 p-4">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-lg max-h-full overflow-y-auto">
                        <h3 className="text-2xl font-bold mb-6">Criar Plano de Estudos</h3>
                        <form onSubmit={handleGeneratePlan} className="space-y-4">
                            <div>
                                <label className="font-semibold">Data da Prova (opcional)</label>
                                <input type="date" value={examDate} onChange={e => setExamDate(e.target.value)} className="w-full p-2 border rounded-lg mt-1"/>
                            </div>
                            <div>
                                <label className="font-semibold">Horas de estudo por dia</label>
                                <input type="number" value={studyHours} onChange={e => setStudyHours(e.target.value)} min="1" max="12" className="w-full p-2 border rounded-lg mt-1"/>
                            </div>
                            <div>
                                <label className="font-semibold">Matérias Prioritárias</label>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    {availableSubjects.map(subject => (
                                        <label key={subject} className="flex items-center gap-2 p-2 rounded-lg bg-gray-100 cursor-pointer">
                                            <input type="checkbox" checked={priorities.includes(subject)} onChange={() => handlePriorityChange(subject)} className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"/>
                                            <span className="capitalize">{subject.replace(/([A-Z])/g, ' $1')}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-end gap-4 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="py-2 px-6 bg-gray-200 rounded-lg font-semibold">Cancelar</button>
                                <button type="submit" disabled={isLoading} className="flex items-center justify-center gap-2 py-2 px-6 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 disabled:bg-blue-300">
                                    {isLoading ? <LoaderCircle className="animate-spin" /> : 'Gerar Plano ✨'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const Profile = ({ userData }) => {
    if (!userData) return <LoaderCircle className="animate-spin mx-auto" />;
    const isAnonymous = auth.currentUser ? auth.currentUser.isAnonymous : false;
    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-green-400 flex items-center justify-center text-white text-4xl font-bold">
                    {userData.nome ? userData.nome.charAt(0).toUpperCase() : '?'}
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">{isAnonymous ? "Visitante" : userData.nome}</h2>
                    <p className="text-lg text-orange-500 font-semibold">{userData.pontos} pontos</p>
                    {isAnonymous && <p className="text-sm text-gray-500 mt-1">Cadastre-se para salvar seu progresso!</p>}
                </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-md">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Desempenho Geral</h3>
                <p>Gráficos e estatísticas de desempenho do usuário seriam exibidos aqui.</p>
            </div>
        </div>
    );
};


// --- Componente Principal ---
export default function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  const [screen, setScreen] = useState('dashboard');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [studyMode, setStudyMode] = useState('vestibular');

  useEffect(() => {
    const attemptInitialSignIn = async () => {
        if (auth.currentUser) {
            setAuthLoading(false);
            return;
        }
        try {
            if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                await signInWithCustomToken(auth, __initial_auth_token);
            } else {
                await signInAnonymously(auth);
            }
        } catch (error) {
            console.error("Falha no login automático:", error);
        } finally {
            setAuthLoading(false);
        }
    };

    attemptInitialSignIn();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
    });
    
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
        const userDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/profile/data`);
        const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setUserData(docSnap.data());
            } else {
                const profileData = user.isAnonymous 
                    ? { ...initialUserDataTemplate, nome: "Visitante" }
                    : { ...initialUserDataTemplate, nome: user.displayName || "Novo Aluno", email: user.email };

                setUserData(profileData); 
                
                setDoc(userDocRef, profileData).catch(err => {
                    console.error("Falha ao salvar o perfil do novo usuário:", err);
                });
            }
        }, (error) => {
            console.error("Erro no listener do Firestore:", error);
            setUserData({ ...initialUserDataTemplate, nome: "Visitante (Offline)" });
        });
        return () => unsubscribe();
    } else {
        setUserData(null);
    }
  }, [user]);

  const handleLogout = async () => {
      try {
          await signOut(auth);
      } catch (error) {
          console.error("Erro ao fazer logout:", error);
      }
  };

  const renderScreen = () => {
    switch (screen) {
      case 'questoes': return <QuestionBank studyMode={studyMode} userData={userData} />;
      case 'resumos': return <Summaries studyMode={studyMode} userData={userData} />;
      case 'dicas': return <StudyTips />;
      case 'cronograma': return <Schedule studyMode={studyMode} userData={userData} />;
      case 'perfil': return <Profile userData={userData} />;
      case 'dashboard':
      default:
        return <Dashboard setScreen={setScreen} userData={userData} studyMode={studyMode} setStudyMode={setStudyMode} />;
    }
  };
  
  if (authLoading || (user && !userData)) {
      return <div className="min-h-screen flex items-center justify-center"><LoaderCircle className="animate-spin text-blue-500" size={48}/></div>;
  }

  if (!user) {
      return <AuthScreen />;
  }

  return (
    <div className="bg-gray-50 min-h-screen font-sans text-gray-900">
      <Header setScreen={setScreen} isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} handleLogout={handleLogout} user={user} />
      <main className="container mx-auto p-4 md-p-8">
        {renderScreen()}
      </main>
      <footer className="text-center py-6 text-gray-500">
        <p>&copy; 2024 AMC+. Foco total no seu futuro.</p>
      </footer>
    </div>
  );
}
