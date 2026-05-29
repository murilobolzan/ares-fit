'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function usePlan() {
  const [plan, setPlan] = useState<'free' | 'pro'>('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPlanLifecycle = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan, pro_trial_expires_at')
        .eq('id', user.id)
        .single();
        
      if (profile) {
        // Validação ativa de expiração da recompensa do Growth Loop
        if (profile.plan === 'pro' && profile.pro_trial_expires_at) {
          const expirationDate = new Date(profile.pro_trial_expires_at);
          const now = new Date();
          
          if (expirationDate < now) {
            // Rebaixar plano automaticamente por decurso de prazo bônus
            await supabase
              .from('profiles')
              .update({ plan: 'free' })
              .eq('id', user.id);
              
            setPlan('free');
            setLoading(false);
            return;
          }
        }
        
        setPlan(profile.plan as 'free' | 'pro');
      }
      setLoading(false);
    };
    
    checkPlanLifecycle();
  }, []);

  return { plan, isPro: plan === 'pro', loading };
}