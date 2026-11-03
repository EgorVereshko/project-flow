import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import Button from '../../components/Button/Button';
import Card from '../../components/Card/Card';
import { useAuthStore } from '../../features/auth/authStore';
import {
  getMyProfile,
  PROFILE_QUERY_KEY,
  updateMyProfile,
  type ProfileData,
  type ProfileTask,
} from '../../services/profileApi';

import './ProfilePage.scss';

type StatusFilter = 'all' | ProfileTask['status'];
type BoardFilter = 'all' | string;

const statusLabels: Record<ProfileTask['status'], string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
  overdue: 'Overdue',
};

function formatDate(value: string | null): string {
  if (!value) return 'No deadline';
  return new Date(`${value}T00:00:00`).toLocaleDateString();
}

function ProfileTaskItem({ task }: { task: ProfileTask }) {
  return (
    <Link
      className="profile__task"
      to={`/boards/${task.boardId}`}
      key={task.id}
    >
      <div className="profile__task-main">
        <strong className="profile__task-title">{task.title}</strong>
        <span className="profile__task-location">
          {task.boardName} <span aria-hidden="true">/</span> {task.columnTitle}
        </span>
      </div>
      <div className="profile__task-meta">
        <span className={`profile__badge profile__badge--${task.status}`}>
          {statusLabels[task.status]}
        </span>
        <span className={`profile__badge profile__badge--priority-${task.priority}`}>
          {task.priority}
        </span>
        <span className="profile__task-deadline">
          {formatDate(task.deadline)}
        </span>
        {task.assigneeName && (
          <span className="profile__task-assignee">
            Assigned to {task.assigneeName}
          </span>
        )}
      </div>
    </Link>
  );
}

function ProfilePage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const setUserName = useAuthStore((state) => state.setUserName);
  const queryClient = useQueryClient();
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [boardFilter, setBoardFilter] = useState<BoardFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [deadlineSort, setDeadlineSort] = useState<'asc' | 'desc'>('asc');

  const profileQueryKey = [...PROFILE_QUERY_KEY, accessToken] as const;
  const profileQuery = useQuery({
    queryKey: profileQueryKey,
    queryFn: () => getMyProfile(accessToken!),
    enabled: Boolean(accessToken),
  });

  const updateNameMutation = useMutation({
    mutationFn: (name: string) => updateMyProfile(name, accessToken!),
    onSuccess: async (profile) => {
      setUserName(profile.username);
      queryClient.setQueryData<ProfileData>(profileQueryKey, (current) =>
        current ? { ...current, profile } : current,
      );
      setIsEditingName(false);
      setNameError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['users'] }),
        queryClient.invalidateQueries({ queryKey: ['board'] }),
        queryClient.invalidateQueries({ queryKey: ['boards'] }),
      ]);
    },
    onError: () => {
      setNameError('Could not update your username. Please try again.');
    },
  });

  const profile = profileQuery.data;
  const visibleTasks = useMemo(() => {
    if (!profile) return [];

    return profile.assignedTasks
      .filter((task) =>
        boardFilter === 'all' || task.boardId === boardFilter,
      )
      .filter((task) =>
        statusFilter === 'all' || task.status === statusFilter,
      )
      .sort((left, right) => {
        if (!left.deadline) return right.deadline ? 1 : 0;
        if (!right.deadline) return -1;
        const order = left.deadline.localeCompare(right.deadline);
        return deadlineSort === 'asc' ? order : -order;
      });
  }, [boardFilter, deadlineSort, profile, statusFilter]);

  function startEditingName() {
    if (!profile) return;
    setNameDraft(profile.profile.username);
    setNameError(null);
    setIsEditingName(true);
  }

  function saveName(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = nameDraft.trim();

    if (!name || name.length > 100) {
      setNameError('Username must be between 1 and 100 characters.');
      return;
    }

    updateNameMutation.mutate(name);
  }

  if (profileQuery.isPending) {
    return <main className="profile"><p>Loading profile...</p></main>;
  }

  if (profileQuery.isError || !profile) {
    return (
      <main className="profile">
        <section className="profile__state">
          <h1>Profile unavailable</h1>
          <p>We could not load your profile. Check your connection and try again.</p>
          <Button onClick={() => void profileQuery.refetch()}>Try again</Button>
        </section>
      </main>
    );
  }

  return (
    <main className="profile">
      <header className="profile__header">
        <div>
          <p className="profile__eyebrow">Account</p>
          <h1>My Profile</h1>
          <p className="profile__subtitle">Your work and account overview.</p>
        </div>
        <div className="profile__member-since">
          Member since {new Date(profile.profile.createdAt).toLocaleDateString()}
        </div>
      </header>

      <Card className="profile__identity">
        <div className="profile__avatar" aria-hidden="true">
          {profile.profile.username.slice(0, 1).toUpperCase()}
        </div>
        <div className="profile__identity-details">
          {isEditingName ? (
            <form className="profile__name-form" onSubmit={saveName}>
              <label htmlFor="profile-username">Username</label>
              <input
                id="profile-username"
                maxLength={100}
                value={nameDraft}
                onChange={(event) => setNameDraft(event.target.value)}
                autoFocus
              />
              <div className="profile__name-actions">
                <Button type="submit" disabled={updateNameMutation.isPending}>
                  {updateNameMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsEditingName(false)}
                  disabled={updateNameMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
              {nameError && <p className="profile__error" role="alert">{nameError}</p>}
            </form>
          ) : (
            <>
              <h2>{profile.profile.username}</h2>
              <p>{profile.profile.email}</p>
              <Button variant="secondary" onClick={startEditingName}>
                Edit username
              </Button>
            </>
          )}
        </div>
      </Card>

      <section className="profile__section" aria-labelledby="profile-stats-heading">
        <h2 id="profile-stats-heading" className="profile__section-title">Task Statistics</h2>
        <div className="profile__stats">
          {[
            ['Total Tasks', profile.stats.totalTasks, 'total'],
            ['Completed', profile.stats.completed, 'done'],
            ['In Progress', profile.stats.inProgress, 'progress'],
            ['To Do', profile.stats.todo, 'todo'],
            ['Overdue', profile.stats.overdue, 'overdue'],
          ].map(([label, value, kind]) => (
            <Card className={`profile__stat profile__stat--${kind}`} key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </Card>
          ))}
        </div>
      </section>

      <section className="profile__section" aria-labelledby="profile-boards-heading">
        <div className="profile__section-heading">
          <h2 id="profile-boards-heading" className="profile__section-title">My Boards</h2>
        </div>
        {profile.boards.length === 0 ? (
          <p className="profile__empty">
            No boards have tasks assigned to you yet.
          </p>
        ) : (
          <div className="profile__boards">
            {profile.boards.map((board) => (
              <Link
                className="profile__board"
                to={`/boards/${board.id}`}
                key={board.id}
              >
                <div className="profile__board-heading">
                  <h3>{board.name}</h3>
                  <span>{board.completionPercent}% complete</span>
                </div>
                {board.description && <p>{board.description}</p>}
                <div className="profile__board-progress" aria-label={`${board.completionPercent}% complete`}>
                  <span style={{ width: `${board.completionPercent}%` }} />
                </div>
                <small>
                  {board.completedCount} of {board.taskCount} assigned tasks completed
                </small>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="profile__section" aria-labelledby="profile-tasks-heading">
        <div className="profile__section-heading profile__section-heading--filters">
          <h2 id="profile-tasks-heading" className="profile__section-title">My Tasks</h2>
          <div className="profile__filters">
            <label>
              Board
              <select
                value={boardFilter}
                onChange={(event) => setBoardFilter(event.target.value)}
              >
                <option value="all">All boards</option>
                {profile.boards.map((board) => (
                  <option value={board.id} key={board.id}>{board.name}</option>
                ))}
              </select>
            </label>
            <label>
              Status
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              >
                <option value="all">All statuses</option>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option value={value} key={value}>{label}</option>
                ))}
              </select>
            </label>
            <label>
              Deadline
              <select
                value={deadlineSort}
                onChange={(event) => setDeadlineSort(event.target.value as 'asc' | 'desc')}
              >
                <option value="asc">Soonest first</option>
                <option value="desc">Latest first</option>
              </select>
            </label>
          </div>
        </div>
        {visibleTasks.length === 0 ? (
          <p className="profile__empty">
            {profile.assignedTasks.length === 0
              ? 'You have no tasks assigned to you.'
              : 'No assigned tasks match these filters.'}
          </p>
        ) : (
          <div className="profile__task-list">
            {visibleTasks.map((task) => <ProfileTaskItem task={task} key={task.id} />)}
          </div>
        )}
      </section>

      <section className="profile__section" aria-labelledby="profile-created-heading">
        <h2 id="profile-created-heading" className="profile__section-title">Created by Me</h2>
        {profile.createdTasks.length === 0 ? (
          <p className="profile__empty">You have not created any tasks yet.</p>
        ) : (
          <div className="profile__task-list">
            {profile.createdTasks.map((task) => (
              <ProfileTaskItem task={task} key={task.id} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default ProfilePage;
