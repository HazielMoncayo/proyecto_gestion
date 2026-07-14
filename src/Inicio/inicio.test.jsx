import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Inicio from './inicio';
import { supabase } from '../supaBase/supabaseClient';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));


vi.mock('../supaBase/supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
    },
  },
}));

it('muestra un mensaje de error con credenciales inválidas', async () => {
  
  // ===== ARRANGE =====
  supabase.auth.signInWithPassword.mockResolvedValue({
    data: null,
    error: { message: 'Invalid login credentials' },
  });


  render(<Inicio />);


  // ===== ACT =====
  fireEvent.change(screen.getByPlaceholderText('usuario@epn.edu.ec'), {
    target: { value: 'malo@epn.edu.ec' },
  });

  // ...escribir su contraseña...
  fireEvent.change(screen.getByPlaceholderText('••••••••'), {
    target: { value: 'wrongpass' },
  });


  fireEvent.click(screen.getByRole('button', { name: /ingresar/i }));


  // ===== ASSERT =====
  expect(await screen.findByText('Credenciales incorrectas.')).toBeInTheDocument();

  
  expect(mockNavigate).not.toHaveBeenCalled();
});

it('redirige a /encargado cuando el rol es "encargado"', async () => {
  
  // ===== ARRANGE ====
  supabase.auth.signInWithPassword.mockResolvedValue({
    data: { user: { user_metadata: { rol: 'encargado' } } },
    error: null,
  });

  render(<Inicio />);

  // ===== ACT =====
  fireEvent.change(screen.getByPlaceholderText('usuario@epn.edu.ec'), {
    target: { value: 'encargado@epn.edu.ec' },
  });
  fireEvent.change(screen.getByPlaceholderText('••••••••'), {
    target: { value: '123456' },
  });
  fireEvent.click(screen.getByRole('button', { name: /ingresar/i }));

  // ===== ASSERT =====
  await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/encargado'));
});

it('redirige a /estudiante cuando el rol NO es "encargado"', async () => {
  
  // ===== ARRANGE =====
  supabase.auth.signInWithPassword.mockResolvedValue({
    data: { user: { user_metadata: { rol: 'estudiante' } } },
    error: null,
  });

  render(<Inicio />);

  // ===== ACT =====
  fireEvent.change(screen.getByPlaceholderText('usuario@epn.edu.ec'), {
    target: { value: 'estudiante@epn.edu.ec' },
  });
  fireEvent.change(screen.getByPlaceholderText('••••••••'), {
    target: { value: '123456' },
  });
  fireEvent.click(screen.getByRole('button', { name: /ingresar/i }));

  // ===== ASSERT =====
  await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/estudiante'));
});

it('muestra el estado de carga mientras se envía el formulario', async () => {
  
  // ===== ARRANGE =====
 
  supabase.auth.signInWithPassword.mockImplementation(
    () =>
      new Promise((resolve) =>
        setTimeout(
          () => resolve({ data: { user: { user_metadata: {} } }, error: null }),
          100
        )
      )
  );

  render(<Inicio />);

  // ===== ACT =====
  fireEvent.change(screen.getByPlaceholderText('usuario@epn.edu.ec'), {
    target: { value: 'test@epn.edu.ec' },
  });
  fireEvent.change(screen.getByPlaceholderText('••••••••'), {
    target: { value: '123456' },
  });
  fireEvent.click(screen.getByRole('button', { name: /ingresar/i }));

  // ===== ASSERT =====
  
  expect(await screen.findByText(/ingresando/i)).toBeInTheDocument();
});

it('renderiza el formulario y permite escribir en los campos', () => {
  
  // ===== ARRANGE =====
  render(<Inicio />);

  // ===== ACT =====
  const emailInput = screen.getByPlaceholderText('usuario@epn.edu.ec');
  const passInput = screen.getByPlaceholderText('••••••••');

  fireEvent.change(emailInput, { target: { value: 'test@epn.edu.ec' } });
  fireEvent.change(passInput, { target: { value: '123456' } });

  // ===== ASSERT =====
  
  expect(emailInput).toBeInTheDocument();
  expect(passInput).toBeInTheDocument();
  expect(emailInput.value).toBe('test@epn.edu.ec');
  expect(passInput.value).toBe('123456');
});