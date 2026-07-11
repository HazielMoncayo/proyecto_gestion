import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Inicio from './inicio';
import { supabase } from '../supaBase/supabaseClient';

// Creamos la función falsa que reemplazará a "navigate"
const mockNavigate = vi.fn();

// Simulamos useNavigate para verificar a dónde redirige sin usar un router real
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Simulamos Supabase para no depender de la red ni de datos reales
vi.mock('../supaBase/supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
    },
  },
}));

it('muestra un mensaje de error con credenciales inválidas', async () => {
  
  // ===== ARRANGE =====
  // Preparamos el "actor falso" (mock) de Supabase para que,
  // cuando se le llame, responda como si el login hubiera fallado.
  // Esto pasa ANTES de que el usuario haga nada.
  supabase.auth.signInWithPassword.mockResolvedValue({
    data: null,
    error: { message: 'Invalid login credentials' },
  });

  // También es "Arrange": ponemos el componente en pantalla,
  // listo para que el usuario (simulado) interactúe con él.
  render(<Inicio />);


  // ===== ACT =====
  // Aquí simulamos las acciones del usuario real:
  // escribir su correo...
  fireEvent.change(screen.getByPlaceholderText('usuario@epn.edu.ec'), {
    target: { value: 'malo@epn.edu.ec' },
  });

  // ...escribir su contraseña...
  fireEvent.change(screen.getByPlaceholderText('••••••••'), {
    target: { value: 'wrongpass' },
  });

  // ...y hacer clic en el botón "Ingresar".
  // Este clic dispara el handleSubmit() de tu componente,
  // que internamente llama a supabase.auth.signInWithPassword
  // (el cual, gracias al ARRANGE, va a "fallar" a propósito).
  fireEvent.click(screen.getByRole('button', { name: /ingresar/i }));


  // ===== ASSERT =====
  // Aquí comprobamos que el resultado sea el esperado:
  // que el mensaje de error aparezca en pantalla...
  expect(await screen.findByText('Credenciales incorrectas.')).toBeInTheDocument();

  // ...y que, como el login falló, NUNCA se haya intentado navegar
  // a otra página (confirma que tu componente no redirige por error).
  expect(mockNavigate).not.toHaveBeenCalled();
});

it('redirige a /encargado cuando el rol es "encargado"', async () => {
  
  // ===== ARRANGE =====
  // Esta vez el mock de Supabase responde con ÉXITO,
  // simulando un usuario con rol "encargado"
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
  // Verificamos que se haya llamado a navigate() con la ruta correcta.
  // Usamos waitFor porque la navegación pasa DESPUÉS de un await
  // dentro del componente (no es instantánea).
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
  // Usamos una Promise con setTimeout para simular que Supabase
  // tarda un poco en responder (así podemos "atrapar" el estado de carga
  // antes de que termine).
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
  // findByText espera hasta que aparezca el texto (por eso funciona
  // aunque el mock tarde 100ms en resolver)
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
  // Verificamos que los inputs existan Y que su valor haya cambiado
  expect(emailInput).toBeInTheDocument();
  expect(passInput).toBeInTheDocument();
  expect(emailInput.value).toBe('test@epn.edu.ec');
  expect(passInput.value).toBe('123456');
});