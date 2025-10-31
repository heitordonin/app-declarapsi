import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

export interface AuthUser {
  id: string;
  email?: string;
  [key: string]: any;
}

export interface ValidationResult {
  success: boolean;
  user?: AuthUser;
  role?: string;
  error?: string;
}

/**
 * Valida o JWT token e retorna os dados do usuário
 * @param req - Request object com header Authorization
 * @param supabase - Cliente Supabase
 * @returns Dados do usuário autenticado
 * @throws Error se token inválido ou ausente
 */
export async function validateAuth(
  req: Request,
  supabase: SupabaseClient
): Promise<AuthUser> {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader) {
    throw new Error('Missing authorization header');
  }

  const token = authHeader.replace('Bearer ', '');
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    console.error('Auth validation error:', error);
    throw new Error('Invalid or expired token');
  }

  return user as AuthUser;
}

/**
 * Valida se o usuário possui a role necessária
 * @param supabase - Cliente Supabase
 * @param userId - ID do usuário
 * @param requiredRole - Role necessária ('admin' ou 'client')
 * @returns Role do usuário
 * @throws Error se role não encontrada ou inadequada
 */
export async function validateRole(
  supabase: SupabaseClient,
  userId: string,
  requiredRole: 'admin' | 'client'
): Promise<string> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();
  
  if (error || !data) {
    console.error('Role fetch error:', error);
    throw new Error('User role not found');
  }

  if (data.role !== requiredRole) {
    throw new Error(`Access denied. Required role: ${requiredRole}, user has: ${data.role}`);
  }
  
  return data.role;
}

/**
 * Registra tentativa de acesso (sucesso ou falha) na tabela de auditoria
 * @param supabase - Cliente Supabase (service role para bypass RLS)
 * @param userId - ID do usuário (ou 'anonymous' se não autenticado)
 * @param functionName - Nome da edge function
 * @param success - Se o acesso foi bem-sucedido
 * @param metadata - Dados adicionais (IP, erro, etc.)
 */
export async function logAccessAttempt(
  supabase: SupabaseClient,
  userId: string,
  functionName: string,
  success: boolean,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    // Buscar org_id do usuário
    let orgId = null;
    if (userId !== 'anonymous') {
      const { data: orgData } = await supabase
        .rpc('get_user_org', { _user_id: userId });
      orgId = orgData;
    }

    const { error } = await supabase
      .from('audit_events')
      .insert({
        user_id: userId === 'anonymous' ? null : userId,
        org_id: orgId,
        action: success ? 'function_access' : 'unauthorized_access',
        resource_type: 'edge_function',
        resource_id: functionName,
        metadata: {
          timestamp: new Date().toISOString(),
          success,
          function_name: functionName,
          ...metadata
        }
      });

    if (error) {
      console.error('Failed to log access attempt:', error);
    }
  } catch (error) {
    // Não falhar a função se logging falhar
    console.error('Error in logAccessAttempt:', error);
  }
}

/**
 * Extrai informações da requisição para auditoria
 * @param req - Request object
 * @returns Objeto com IP, user agent, etc.
 */
export function extractRequestMetadata(req: Request): Record<string, any> {
  return {
    ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
    user_agent: req.headers.get('user-agent') || 'unknown',
    origin: req.headers.get('origin') || 'unknown',
    method: req.method,
  };
}

/**
 * Middleware completo que valida auth + role e registra acesso
 * Uso simplificado em uma linha
 * 
 * @example
 * const { user, role } = await validateAccess(req, supabase, 'admin', 'my-function');
 */
export async function validateAccess(
  req: Request,
  supabase: SupabaseClient,
  requiredRole: 'admin' | 'client',
  functionName: string
): Promise<{ user: AuthUser; role: string }> {
  try {
    const user = await validateAuth(req, supabase);
    const role = await validateRole(supabase, user.id, requiredRole);
    
    // Log acesso bem-sucedido
    await logAccessAttempt(
      supabase,
      user.id,
      functionName,
      true,
      extractRequestMetadata(req)
    );
    
    return { user, role };
  } catch (error) {
    // Log acesso negado
    const errorMessage = error instanceof Error ? error.message : String(error);
    const metadata = {
      ...extractRequestMetadata(req),
      error: errorMessage
    };
    
    // Tentar extrair user_id mesmo se auth falhou parcialmente
    let userId = 'anonymous';
    try {
      const authHeader = req.headers.get('Authorization');
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const { data } = await supabase.auth.getUser(token);
        if (data?.user) {
          userId = data.user.id;
        }
      }
    } catch {
      // Manter como anonymous
    }
    
    await logAccessAttempt(supabase, userId, functionName, false, metadata);
    
    throw error;
  }
}
