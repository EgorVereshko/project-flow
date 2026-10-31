
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Button from '../../components/Button/Button';

import {
  taskSchema,
  type TaskFormValues,
} from './taskSchema';
import type { BoardMember } from '../../types/board';

import './TaskForm.scss';

type TaskFormProps = {
  defaultValues: TaskFormValues;
  members: BoardMember[];
  submitLabel: string;
  onSubmit: (values: TaskFormValues) => void | Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
};

function TaskForm({
  defaultValues,
  members,
  submitLabel,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: TaskFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting: isFormSubmitting },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues,
  });

  const submitting = isSubmitting || isFormSubmitting;

  async function submitForm(values: TaskFormValues) {
    await onSubmit({
      ...values,
      title: values.title.trim(),
      description: values.description.trim(),
    });
  }

  return (
    <form className="task-form" onSubmit={handleSubmit(submitForm)}>
      <div className="task-form__field">
        <label className="task-form__label" htmlFor="task-title">
          Title
        </label>

        <input
          id="task-title"
          className="task-form__input"
          type="text"
          placeholder="Enter task title"
          disabled={submitting}
          {...register('title')}
        />

        {errors.title && (
          <p className="task-form__error">{errors.title.message}</p>
        )}
      </div>

      <div className="task-form__field">
        <label className="task-form__label" htmlFor="task-description">
          Description
        </label>

        <textarea
          id="task-description"
          className="task-form__textarea"
          placeholder="Describe the task"
          rows={5}
          disabled={submitting}
          {...register('description')}
        />

        {errors.description && (
          <p className="task-form__error">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="task-form__field">
        <label className="task-form__label" htmlFor="task-assignee">
          Assignee
        </label>

        <select
          id="task-assignee"
          className="task-form__input"
          disabled={submitting}
          {...register('assigneeId')}
        >
          <option value="">Unassigned</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name} ({member.email})
            </option>
          ))}
        </select>

        {errors.assigneeId && (
          <p className="task-form__error">
            {errors.assigneeId.message}
          </p>
        )}
      </div>

      <div className="task-form__field">
        <label className="task-form__label" htmlFor="task-deadline">
          Deadline
        </label>

        <input
          id="task-deadline"
          className="task-form__input"
          type="date"
          disabled={submitting}
          {...register('deadline')}
        />

        {errors.deadline && (
          <p className="task-form__error">
            {errors.deadline.message}
          </p>
        )}
      </div>

      <div className="task-form__actions">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </Button>

        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}

export default TaskForm;