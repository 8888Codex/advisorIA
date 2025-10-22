export interface Agent {
  id: string;
  name: string;
  avatar: string;
  title: string;
  description: string;
  tags: string[];
  fidelity: 'Alta';
  customizable: boolean;
}

export const availableAgents: Agent[] = [
  {
    id: 'steve-jobs',
    name: 'Steve Jobs',
    avatar: '/steve-jobs.png',
    title: 'Co-fundador da Apple',
    description: 'Especialista em branding, design de produto e criação de categorias de mercado. Foco na simplicidade e experiência do usuário.',
    tags: ['Branding', 'Design de Produto', 'Inovação'],
    fidelity: 'Alta',
    customizable: false,
  },
  {
    id: 'russell-brunson',
    name: 'Russell Brunson',
    avatar: '/russell-brunson.png',
    title: 'Co-fundador da ClickFunnels',
    description: 'Mestre em funis de vendas, marketing de resposta direta e criação de ofertas irresistíveis para escalar negócios online.',
    tags: ['Funis de Venda', 'Marketing Direto', 'Copywriting'],
    fidelity: 'Alta',
    customizable: false,
  },
  {
    id: 'jeff-bezos',
    name: 'Jeff Bezos',
    avatar: '/jeff-bezos.png',
    title: 'Fundador da Amazon',
    description: 'Foco implacável no cliente, pensamento de longo prazo e otimização de operações para crescimento e domínio de mercado.',
    tags: ['E-commerce', 'Customer-Centric', 'Escalabilidade'],
    fidelity: 'Alta',
    customizable: false,
  },
  {
    id: 'david-ogilvy',
    name: 'David Ogilvy',
    avatar: '/david-ogilvy.png',
    title: 'Fundador da Ogilvy & Mather',
    description: 'O "Pai da Publicidade". Especialista em pesquisa, copywriting baseado em resultados e criação de marcas fortes e duradouras.',
    tags: ['Publicidade', 'Copywriting', 'Branding'],
    fidelity: 'Alta',
    customizable: false,
  },
  {
    id: 'philip-kotler',
    name: 'Philip Kotler',
    avatar: '/philip-kotler.png',
    title: 'Professor e Autor de Marketing',
    description: 'Autoridade global em marketing estratégico. Foco nos 4 Ps, segmentação de mercado e gestão de marketing holística.',
    tags: ['Marketing Estratégico', 'Gestão', 'Posicionamento'],
    fidelity: 'Alta',
    customizable: false,
  },
];