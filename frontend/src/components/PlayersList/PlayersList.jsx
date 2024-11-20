import { useState, useCallback, useEffect } from 'react';
import PlayersListHeader from './components/PlayersListHeader';
import PlayersListFilters from './components/PlayersListFilters';
import PlayerListItem from './components/PlayerListItem';
import EmptyState from './components/EmptyState';
import userService from '../../services/userService';
import styles from './PlayersList.module.css';

export default function PlayersList() {
  const [players, setPlayers] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });
  const [activeTab, setActiveTab] = useState('all');
  const [filter, setFilter] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await userService.getUsers({}, { 
        page: pagination.page, 
        limit: pagination.limit 
      });
      setPlayers(result.users);
      setPagination(result.pagination);
    } catch (err) {
      setError(err.message || 'Failed to fetch users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const tabs = [
    { id: 'all', label: `All (${pagination.total})` },
    { id: 'friends', label: `Friends (${players.filter(p => p.isFriend).length})` }
  ];

  // Find current tab index
  const currentTabIndex = tabs.findIndex(tab => tab.id === activeTab);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const nextIndex = (currentTabIndex + (e.shiftKey ? -1 : 1)) % tabs.length;
      // Handle wrapping
      const newIndex = nextIndex < 0 ? tabs.length - 1 : nextIndex;
      setActiveTab(tabs[newIndex].id);
      return;
    }

    if (e.key === 'Escape' && filter) {
      e.preventDefault();
      setFilter('');
      if (searchFocused) {
        e.target.blur();
        setSearchFocused(false);
      }
    }
  }, [currentTabIndex, tabs, filter, searchFocused]);

  const handleSelect = (playerId) => {
    setSelectedPlayerId(playerId === selectedPlayerId ? null : playerId);
  };

  const handleWhisper = (playerId) => {
    console.log('Whisper to:', playerId);
  };

  const handleAddFriend = (playerId) => {
    console.log('Add friend:', playerId);
  };

  const handleContainerContextMenu = (e) => {
    e.preventDefault(); // Prevent browser context menu on container
  };

  const filteredPlayers = players.filter(player => {
    if (activeTab === 'friends' && !player.isFriend) return false;
    if (!filter) return true;
    return player.nickname.toLowerCase().includes(filter.toLowerCase());
  });

  const getEmptyStateMessage = () => {
    if (filter) {
      return "No matches. Press <ESC> to clear.";
    }
    return activeTab === 'friends' 
      ? "You haven't added any friends yet."
      : "There are no players online.";
  };

  return (
    <div 
      className={styles.playersContainer}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onContextMenu={handleContainerContextMenu}
    >
      <PlayersListHeader 
        tabs={tabs}
        activeTab={activeTab}
        onTabClick={setActiveTab}
      />

      <div 
        className={styles.playersList}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        onContextMenu={handleContainerContextMenu}
      >
        {loading ? (
          <EmptyState message="Loading..." />
        ) : error ? (
          <EmptyState message={error} />
        ) : filteredPlayers.length > 0 ? (
          filteredPlayers.map(player => (
            <PlayerListItem
              key={player.id}
              player={player}
              isSelected={selectedPlayerId === player.id}
              onSelect={handleSelect}
              onWhisper={handleWhisper}
              onAddFriend={handleAddFriend}
            />
          ))
        ) : (
          <EmptyState message={getEmptyStateMessage()} />
        )}
      </div>

      <PlayersListFilters
        filter={filter}
        onFilterChange={setFilter}
        onKeyDown={handleKeyDown}
        onFocus={() => setSearchFocused(true)}
        onBlur={() => setSearchFocused(false)}
      />
    </div>
  );
}