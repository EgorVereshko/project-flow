import {
  useForm,
} from 'react-hook-form';

import {
  zodResolver,
} from '@hookform/resolvers/zod';

import Button from '../../components/Button/Button';

import {
  taskSchema,
  type TaskFormValues,
} from './taskSchema';

import './TaskForm.scss';

type TaskFormProps = {
  defaultValues: TaskFormValues;
  submitLabel: string;
  onSubmit: (
    values: TaskFormValues,
  ) => void;
  onCancel: () => void;
};

function TaskForm({
  defaultValues,
  submitLabel,
  onSubmit,
  onCancel,
}: TaskFormProps) {
  const {
    register,
    handleSubmit,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues,
  });

  function submitForm(
    values: TaskFormValues,
  ) {
    onSubmit({
      ...values,
      title: values.title.trim(),
      description:
        values.description.trim(),
      assignee:
        values.assignee.trim(),
    });
  }

  return (
    <form
      className="task-form"
      onSubmit={handleSubmit(
        submitForm,
      )}
    >
      <div className="task-form__field">
        <label
          className="task-form__label"
          htmlFor="task-title"
        >
          Title
        </label>

        <input
          id="task-title"
          className="task-form__input"
          type="text"
          placeholder="Enter task title"
          {...register('title')}
        />

        {errors.title && (
          <p className="task-form__error">
            {errors.title.message}
          </p>
        )}
      </div>

      <div className="task-form__field">
        <label
          className="task-form__label"
          htmlFor="task-description"
        >
          Description
        </label>

        <textarea
          id="task-description"
          className="task-form__textarea"
          placeholder="Describe the task"
          rows={5}
          {...register(
            'description',
          )}
        />

        {errors.description && (
          <p className="task-form__error">
            {
              errors.description
                .message
            }
          </p>
        )}
      </div>

      <div className="task-form__field">
        <label
          className="task-form__label"
          htmlFor="task-assignee"
        >
          Assignee
        </label>

        <input
          id="task-assignee"
          className="task-form__input"
          type="text"
          placeholder="Enter assignee"
          {...register(
            'assignee',
          )}
        />

        {errors.assignee && (
          <p className="task-form__error">
            {
              errors.assignee
                .message
            }
          </p>
        )}
      </div>

      <div className="task-form__field">
        <label
          className="task-form__label"
          htmlFor="task-deadline"
        >
          Deadline
        </label>

        <input
          id="task-deadline"
          className="task-form__input"
          type="date"
          {...register(
            'deadline',
          )}
        />

        {errors.deadline && (
          <p className="task-form__error">
            {
              errors.deadline
                .message
            }
          </p>
        )}
      </div>

      <div className="task-form__actions">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
        >
          Cancel
        </Button>

        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

export default TaskForm;