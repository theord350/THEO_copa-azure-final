import React, { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Calendar, MapPin, Search, Ticket, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { matches, phaseLabels, formatMatchDate, MatchPhase } from '@/data/matches';
import { getTeamById, Team } from '@/data/teams';
import { getStadiumById } from '@/data/stadiums';
import { cn } from '@/lib/utils';

const phases: MatchPhase[] = ['group', 'round16', 'quarterfinals', 'semifinals', 'third-place', 'final'];

const TeamDisplay: React.FC<{ team: Team; showCode?: boolean }> = ({ team, showCode = true }) => {
  if (team.isTBD) {
    return (
      <div className="text-center flex-1">
        <div className="w-12 h-12 rounded-full bg-primary/10 border-2 border-dashed border-primary/30 flex items-center justify-center mx-auto mb-2">
          <span className="text-xl">{team.flag}</span>
        </div>
        <span className="font-medium text-sm text-muted-foreground">{team.name}</span>
        {showCode && <span className="block text-xs text-muted-foreground/70">{team.code}</span>}
      </div>
    );
  }

  // Check if flag is URL (for Scotland, England)
  const isFlagUrl = team.flag.startsWith('http');

  return (
    <div className="text-center flex-1">
      {isFlagUrl ? (
        <img 
          src={team.flag} 
          alt={`Bandeira ${team.name}`} 
          className="w-12 h-8 object-cover rounded mx-auto mb-2"
        />
      ) : (
        <span className="text-4xl mb-2 block">{team.flag}</span>
      )}
      <span className="font-medium text-sm">{team.name}</span>
      {showCode && <span className="block text-xs text-muted-foreground">{team.code}</span>}
    </div>
  );
};

const Matches: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const groupFilter = searchParams.get('group')?.toUpperCase() || '';

  const [selectedPhase, setSelectedPhase] = useState<MatchPhase | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const clearGroupFilter = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('group');
    setSearchParams(next, { replace: true });
  };

  const filteredMatches = useMemo(() => {
    return matches.filter(match => {
      const homeTeam = getTeamById(match.homeTeamId);
      const awayTeam = getTeamById(match.awayTeamId);
      const stadium = getStadiumById(match.stadiumId);

      // Group filter (vindo do botão "Ver jogos do grupo")
      if (groupFilter && match.group?.toUpperCase() !== groupFilter) return false;

      // Phase filter
      if (selectedPhase !== 'all' && match.phase !== selectedPhase) return false;

      // Search filter - only search real teams
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          (!homeTeam?.isTBD && homeTeam?.name.toLowerCase().includes(query)) ||
          (!awayTeam?.isTBD && awayTeam?.name.toLowerCase().includes(query)) ||
          stadium?.name.toLowerCase().includes(query) ||
          stadium?.city.toLowerCase().includes(query) ||
          phaseLabels[match.phase].toLowerCase().includes(query);

        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [groupFilter, selectedPhase, searchQuery]);

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-display text-4xl md:text-6xl mb-4">
            <span className="gold-text">Jogos</span> da Copa
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Confira todos os jogos da Copa do Mundo FIFA 2026 e garanta seus ingressos para assistir ao vivo.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Buscar por seleção, estádio ou cidade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Phase Filter */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedPhase === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPhase('all')}
              className={selectedPhase === 'all' ? 'gold-gradient' : ''}
            >
              Todos
            </Button>
            {phases.map(phase => (
              <Button
                key={phase}
                variant={selectedPhase === phase ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPhase(phase)}
                className={selectedPhase === phase ? 'gold-gradient' : ''}
              >
                {phaseLabels[phase]}
              </Button>
            ))}
          </div>
        </div>

        {/* Active filter chip (Grupo) */}
        {groupFilter && (
          <div className="mb-4 flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Filtro ativo:</span>
            <button
              type="button"
              onClick={clearGroupFilter}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
            >
              Grupo {groupFilter}
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Results count */}
        <p className="text-sm text-muted-foreground mb-6">
          {filteredMatches.length} {filteredMatches.length === 1 ? 'jogo encontrado' : 'jogos encontrados'}
        </p>

        {/* Matches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMatches.map((match, index) => {
            const homeTeam = getTeamById(match.homeTeamId);
            const awayTeam = getTeamById(match.awayTeamId);
            const stadium = getStadiumById(match.stadiumId);

            if (!homeTeam || !awayTeam || !stadium) return null;

            const isFinal = match.phase === 'final';
            const isSemifinal = match.phase === 'semifinals';
            const isKnockout = ['round16', 'quarterfinals', 'semifinals', 'third-place', 'final'].includes(match.phase);
            const hasTBDTeams = homeTeam.isTBD || awayTeam.isTBD;

            return (
              <Link
                key={match.id}
                to={`/matches/${match.id}`}
                className={cn(
                  "group relative rounded-2xl overflow-hidden bg-card border transition-all duration-300 hover:border-primary/50 animate-fade-in",
                  hasTBDTeams ? "border-dashed border-primary/30" : "border-border"
                )}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Phase Badge */}
                <div className={cn(
                  "absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-medium z-10",
                  isFinal ? "bg-primary text-primary-foreground" :
                  isSemifinal ? "bg-primary/20 text-primary" :
                  isKnockout ? "bg-secondary text-foreground" :
                  "bg-muted text-muted-foreground"
                )}>
                  {phaseLabels[match.phase]}
                  {match.group && ` • Grupo ${match.group}`}
                </div>

                {/* TBD Badge */}
                {hasTBDTeams && (
                  <div className="absolute top-4 right-4 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium z-10">
                    A definir
                  </div>
                )}

                <div className="p-6 pt-14">
                  {/* Teams */}
                  <div className="flex items-center justify-between mb-6">
                    <TeamDisplay team={homeTeam} />
                    <div className="px-4">
                      <span className="font-display text-xl text-muted-foreground">VS</span>
                    </div>
                    <TeamDisplay team={awayTeam} />
                  </div>

                  {/* Divider */}
                  <div className="border-t border-border my-4" />

                  {/* Info */}
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{formatMatchDate(match.date)} • {match.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{stadium.name}</span>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="mt-6 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-muted-foreground block">A partir de</span>
                      <span className="text-lg font-bold text-primary">${stadium.sectors[2]?.price || 300}</span>
                    </div>
                    <Button size="sm" className="gold-gradient group-hover:opacity-90">
                      <Ticket className="w-4 h-4 mr-1" />
                      Comprar
                    </Button>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {filteredMatches.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-4">Nenhum jogo encontrado com os filtros selecionados.</p>
            <Button variant="outline" onClick={() => { setSelectedPhase('all'); setSearchQuery(''); clearGroupFilter(); }}>
              Limpar filtros
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Matches;