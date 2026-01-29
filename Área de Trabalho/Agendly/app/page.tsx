import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Calendar, Users, Clock, TrendingUp } from 'lucide-react'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center p-6 md:p-24 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Gerencie seus agendamentos com facilidade
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8">
            Sistema completo de agendamentos para qualquer tipo de empresa
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/signup">Começar Gratuitamente</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/login">Fazer Login</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6 bg-background">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Tudo que você precisa para gerenciar seus agendamentos
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <Calendar className="h-12 w-12 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Agenda Inteligente</h3>
              <p className="text-sm text-muted-foreground">
                Visualize e gerencie todos os agendamentos em um só lugar
              </p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <Users className="h-12 w-12 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Gestão de Equipe</h3>
              <p className="text-sm text-muted-foreground">
                Controle horários e agendamentos de cada funcionário
              </p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <Clock className="h-12 w-12 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Lembretes Automáticos</h3>
              <p className="text-sm text-muted-foreground">
                Envie lembretes automáticos para reduzir faltas
              </p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <TrendingUp className="h-12 w-12 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Relatórios</h3>
              <p className="text-sm text-muted-foreground">
                Acompanhe o desempenho do seu negócio
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t">
        <div className="max-w-6xl mx-auto text-center text-sm text-muted-foreground">
          <p>&copy; 2024 Agendly. Todos os direitos reservados.</p>
        </div>
      </footer>
    </main>
  );
}
