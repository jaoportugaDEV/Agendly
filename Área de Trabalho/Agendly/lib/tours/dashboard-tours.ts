import { Step } from 'react-joyride'

export const agendaTourSteps: Step[] = [
  {
    target: 'body',
    content: 'Bem-vindo à Agenda! Aqui você gerencia todos os agendamentos da sua empresa.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '.tour-calendar',
    content: 'Este é o calendário de agendamentos. Visualize todos os horários marcados.',
  },
  {
    target: '.tour-create-button',
    content: 'Clique aqui para criar um novo agendamento manualmente.',
  },
]

export const equipeTourSteps: Step[] = [
  {
    target: 'body',
    content: 'Esta é a área de gestão da Equipe. Aqui você gerencia seus funcionários.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '.tour-add-staff',
    content: 'Clique aqui para adicionar novos membros à equipe.',
  },
  {
    target: '.tour-staff-card',
    content: 'Cada card mostra um membro da equipe. Use o menu (⋮) para gerenciar horários, ausências e permissões.',
  },
]

export const servicosTourSteps: Step[] = [
  {
    target: 'body',
    content: 'Aqui você gerencia os serviços que sua empresa oferece.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '.tour-add-service',
    content: 'Adicione novos serviços clicando aqui.',
  },
  {
    target: '.tour-service-list',
    content: 'Lista de todos os serviços. Edite preço, duração e descrição a qualquer momento.',
  },
]

export const clientesTourSteps: Step[] = [
  {
    target: 'body',
    content: 'Gerencie sua base de clientes nesta página.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '.tour-add-client',
    content: 'Cadastre novos clientes manualmente.',
  },
  {
    target: '.tour-client-list',
    content: 'Veja histórico e agendamentos de cada cliente.',
  },
]

export const avaliacoesTourSteps: Step[] = [
  {
    target: 'body',
    content: 'Acompanhe e responda as avaliações dos seus clientes.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '.tour-stats',
    content: 'Veja estatísticas das suas avaliações: média e distribuição.',
  },
  {
    target: '.tour-visibility-toggle',
    content: 'Use este botão para controlar se a avaliação aparece no site público.',
  },
]

export const configuracoesTourSteps: Step[] = [
  {
    target: 'body',
    content: 'Configure a identidade visual e outras opções da sua empresa.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '.tour-brand-customization',
    content: 'Personalize o logo e cores da sua marca. As mudanças afetam o dashboard e o site público.',
  },
]

export const sitePublicoTourSteps: Step[] = [
  {
    target: 'body',
    content: 'Configure o conteúdo do seu site público.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '.tour-hero-image',
    content: 'Adicione uma imagem de destaque para o topo do site.',
  },
  {
    target: '.tour-gallery',
    content: 'Crie uma galeria de fotos dos seus trabalhos.',
  },
]
