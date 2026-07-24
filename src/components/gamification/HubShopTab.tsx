import { useEffect, useState } from 'react';
import { Crown, ShoppingBag, Sparkles, Users } from 'lucide-react';
import {
  equipShopItem,
  fetchShopCatalog,
  purchaseShopItem,
  redeemPremiumWithFitCoins,
} from '../../api/gamification';
import type { ShopItem } from '../../types/gamification';
import { formatFitCoins } from '../../utils/gamificationDisplay';
import FitCoinIcon from './FitCoinIcon';

const PREMIUM_COST = 500;

type HubShopTabProps = {
  authToken: string;
  fitCoins: number;
  onBalanceChange?: (balance: number) => void;
};

export default function HubShopTab({ authToken, fitCoins, onBalanceChange }: HubShopTabProps) {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadCatalog = async () => {
    setLoading(true);
    const catalog = await fetchShopCatalog(authToken);
    if (catalog) {
      setItems(catalog.items);
      onBalanceChange?.(catalog.fitCoinsBalance);
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadCatalog();
  }, [authToken]);

  const handlePurchase = async (item: ShopItem) => {
    setBusyId(item.id);
    setMessage(null);
    const result = await purchaseShopItem(authToken, item.id);
    if (!result.success) {
      setMessage('No se pudo comprar el artículo.');
      setBusyId(null);
      return;
    }
    if (result.fitCoinsBalance != null) onBalanceChange?.(result.fitCoinsBalance);
    await loadCatalog();
    setMessage(`Desbloqueaste ${item.name}.`);
    setBusyId(null);
  };

  const handleEquip = async (item: ShopItem) => {
    setBusyId(item.id);
    const ok = await equipShopItem(authToken, item.id);
    setBusyId(null);
    setMessage(ok ? `Equipaste ${item.name}.` : 'No se pudo equipar el artículo.');
  };

  const handleRedeemPremium = async () => {
    setBusyId('premium');
    setMessage(null);
    const result = await redeemPremiumWithFitCoins(authToken);
    if (!result.success) {
      setMessage('No se pudo canjear Premium. Revisa tu saldo o límite anual.');
      setBusyId(null);
      return;
    }
    if (result.fitCoinsBalance != null) onBalanceChange?.(result.fitCoinsBalance);
    setMessage('¡Mes Premium activado! Sigue entrenando para maximizarlo.');
    setBusyId(null);
  };

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-2xl border border-lime-500/20 bg-gradient-to-br from-lime-500/10 via-zinc-900 to-zinc-950 p-5">
        <div className="flex items-center gap-2 text-lime-300">
          <ShoppingBag className="w-4 h-4" />
          <p className="text-[10px] uppercase tracking-[0.22em] font-semibold">Tienda FitCoins</p>
        </div>
        <h3 className="text-2xl font-bold text-white mt-2">Personaliza tu GYM</h3>
        <p className="text-sm text-zinc-400 mt-1 leading-relaxed">
          Marcos, celebraciones y plantillas premium para tarjetas compartibles.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-lime-500/20 bg-zinc-950/60 px-3 py-2">
          <FitCoinIcon size={16} />
          <span className="text-sm font-bold text-white tabular-nums">{formatFitCoins(fitCoins)}</span>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-amber-500/10 p-2 text-amber-300">
            <Crown className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">Canje Premium</p>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
              {PREMIUM_COST} FitCoins = 1 mes Premium. Máximo 2 canjes por año.
            </p>
            <button
              type="button"
              disabled={busyId === 'premium' || fitCoins < PREMIUM_COST}
              onClick={() => void handleRedeemPremium()}
              className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-200 disabled:opacity-40"
            >
              Canjear mes Premium
            </button>
          </div>
        </div>
      </div>

      {message ? (
        <div className="rounded-xl border border-lime-500/20 bg-lime-500/5 px-4 py-3 text-sm text-lime-200">
          {message}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-zinc-500 py-8 text-center">Cargando tienda…</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 flex items-start justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-lime-400" />
                  <p className="text-sm font-semibold text-white">{item.name}</p>
                </div>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{item.description}</p>
                <p className="text-[10px] uppercase tracking-wider text-zinc-600 mt-2">{item.rarity}</p>
              </div>
              <div className="shrink-0 text-right space-y-2">
                <p className="text-sm font-bold text-lime-300 tabular-nums">{item.price} FC</p>
                {item.owned ? (
                  <button
                    type="button"
                    disabled={busyId === item.id}
                    onClick={() => void handleEquip(item)}
                    className="rounded-lg border border-zinc-700 px-3 py-1.5 text-[11px] font-semibold text-zinc-200"
                  >
                    Equipar
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={busyId === item.id || fitCoins < item.price}
                    onClick={() => void handlePurchase(item)}
                    className="rounded-lg border border-lime-500/30 bg-lime-500/10 px-3 py-1.5 text-[11px] font-semibold text-lime-200 disabled:opacity-40"
                  >
                    Comprar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 py-3 flex items-start gap-3">
        <Users className="w-4 h-4 text-zinc-500 mt-0.5" />
        <p className="text-xs text-zinc-500 leading-relaxed">
          Las plantillas premium de tarjetas compartibles se aplicarán en la celebración de sesión cuando estén activas.
        </p>
      </div>
    </div>
  );
}
