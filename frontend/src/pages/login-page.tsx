import { type ChangeEvent, type FormEvent, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/auth-context';
import { ApiError } from '../services/api';
import { type FieldErrorMap, formatApiError, getApiFieldErrors } from '../services/error-details';

const demoCredentials = [
  {
    label: 'Admin demo',
    email: 'admin@fastmeals.com',
    password: 'Admin@123',
  },
  {
    label: 'Viewer demo',
    email: 'viewer@fastmeals.com',
    password: 'Viewer@123',
  },
];

type LoginFormState = {
  email: string;
  password: string;
};

type LoginLocationState = {
  from?: {
    pathname?: string;
  };
};

const initialState: LoginFormState = {
  email: '',
  password: '',
};

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const [formState, setFormState] = useState<LoginFormState>(initialState);
  const [fieldErrors, setFieldErrors] = useState<FieldErrorMap>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const destination = (location.state as LoginLocationState | null)?.from?.pathname ?? '/dashboard';

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;

    setFormState((currentState) => ({
      ...currentState,
      [name]: value,
    }));
    setFieldErrors((currentErrors) => {
      if (!(name in currentErrors)) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[name];
      return nextErrors;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validateLoginForm(formState);

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setErrorMessage('Revise os campos destacados antes de continuar.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setFieldErrors({});

    try {
      await signIn(formState);
      navigate(destination, { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        const nextFieldErrors = getApiFieldErrors(error);

        if (Object.keys(nextFieldErrors).length > 0) {
          setFieldErrors(nextFieldErrors);
        }

        setErrorMessage(formatApiError(error, 'Nao foi possivel iniciar a sessao.'));
      } else {
        setErrorMessage('Nao foi possivel iniciar a sessao.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login-card">
      <div className="login-card__header">
        <p className="page-header__eyebrow">Acesso seguro</p>
        <h2>Entrar no painel FastMeals.</h2>
        <p className="page-header__summary">
          O shell ja trabalha com access token Bearer e refresh token em cookie `httpOnly`.
        </p>
      </div>

      <div className="credential-strip">
        {demoCredentials.map((credential) => (
          <button
            key={credential.label}
            className="credential-strip__item"
            onClick={() => {
              setFormState({
                email: credential.email,
                password: credential.password,
              });
            }}
            type="button"
          >
            <strong>{credential.label}</strong>
            <span>{credential.email}</span>
          </button>
        ))}
      </div>

      <form className="login-form" onSubmit={(event) => void handleSubmit(event)}>
        <label className="field">
          <span>Email</span>
          <input
            autoComplete="email"
            aria-invalid={fieldErrors.email ? 'true' : 'false'}
            name="email"
            onChange={handleInputChange}
            placeholder="admin@fastmeals.com"
            type="email"
            value={formState.email}
          />
          {fieldErrors.email ? (
            <small className="field__hint field__hint--error">{fieldErrors.email}</small>
          ) : null}
        </label>

        <label className="field">
          <span>Senha</span>
          <input
            autoComplete="current-password"
            aria-invalid={fieldErrors.password ? 'true' : 'false'}
            name="password"
            onChange={handleInputChange}
            placeholder="Sua senha"
            type="password"
            value={formState.password}
          />
          {fieldErrors.password ? (
            <small className="field__hint field__hint--error">{fieldErrors.password}</small>
          ) : null}
        </label>

        {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

        <button className="button" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Entrando...' : 'Acessar painel'}
        </button>
      </form>
    </div>
  );
}

function validateLoginForm(formState: LoginFormState) {
  const errors: FieldErrorMap = {};
  const normalizedEmail = formState.email.trim();

  if (!normalizedEmail) {
    errors.email = 'Informe o email.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    errors.email = 'Informe um email valido.';
  }

  if (!formState.password.trim()) {
    errors.password = 'Informe a senha.';
  }

  return errors;
}
