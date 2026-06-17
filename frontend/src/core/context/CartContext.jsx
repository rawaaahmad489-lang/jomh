// src/core/context/CartContext.jsx

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

import { supabase } from "../../services/supabaseClient";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartId, setCartId] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // INIT
  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: u } = await supabase
        .from("users")
        .select("user_id")
        .eq("auth_id", user.id)
        .single();

      if (!u) {
        setLoading(false);
        return;
      }

      // get or create cart
      let { data: cart } = await supabase
        .from("cart")
        .select("cart_id")
        .eq("user_id", u.user_id)
        .maybeSingle();

      if (!cart) {
        const { data: newCart } = await supabase
          .from("cart")
          .insert({ user_id: u.user_id })
          .select()
          .single();

        cart = newCart;
      }

      setCartId(cart.cart_id);

      await refreshItems(cart.cart_id);

      setLoading(false);
    };

    init();
  }, []);

 const refreshItems = async (cid) => {
  const id = cid || cartId;
  if (!id) return;
  const { data } = await supabase
    .from("cart_items")
    .select(`
      cart_item_id, quantity,
      products(
        product_id, name, price, image_url, stock,
        store_id,
        stores(store_id, store_name, logo)
      )
    `)
    .eq("cart_id", id);
  setCartItems(data || []);
};

  const addToCart = useCallback(
    async (productId, qty = 1) => {
      if (!cartId) return;

      const { data: existing } = await supabase
        .from("cart_items")
        .select("cart_item_id, quantity")
        .eq("cart_id", cartId)
        .eq("product_id", productId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("cart_items")
          .update({
            quantity: existing.quantity + qty,
          })
          .eq("cart_item_id", existing.cart_item_id);
      } else {
        await supabase.from("cart_items").insert({
          cart_id: cartId,
          product_id: productId,
          quantity: qty,
        });
      }

      await refreshItems();
    },
    [cartId]
  );

  const updateQty = useCallback(async (cartItemId, quantity) => {
    if (quantity < 1) {
      return removeItem(cartItemId);
    }

    await supabase
      .from("cart_items")
      .update({ quantity })
      .eq("cart_item_id", cartItemId);

    await refreshItems();
  }, []);

  const removeItem = useCallback(async (cartItemId) => {
    await supabase
      .from("cart_items")
      .delete()
      .eq("cart_item_id", cartItemId);

    setCartItems((prev) =>
      prev.filter((i) => i.cart_item_id !== cartItemId)
    );
  }, []);

  const clearCart = useCallback(async () => {
    if (!cartId) return;

    await supabase
      .from("cart_items")
      .delete()
      .eq("cart_id", cartId);

    setCartItems([]);
  }, [cartId]);

  const cartTotal = cartItems.reduce(
    (s, i) => s + (i.products?.price || 0) * i.quantity,
    0
  );

  const cartCount = cartItems.reduce(
    (s, i) => s + i.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartTotal,
        cartCount,
        loading,
        addToCart,
        updateQty,
        removeItem,
        clearCart,
        refreshItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);

  if (!ctx) {
    throw new Error("useCart must be inside CartProvider");
  }

  return ctx;
};