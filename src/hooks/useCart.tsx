import {createContext, ReactNode, useContext, useState} from 'react';
import {toast} from 'react-toastify';
import {api} from '../services/api';
import {Product} from '../types';

interface CartProviderProps {
    children: ReactNode;
}

interface UpdateProductAmount {
    productId: number;
    amount: number;
}

interface CartContextData {
    cart: Product[];
    addProduct: (productId: number) => Promise<void>;
    removeProduct: (productId: number) => void;
    updateProductAmount: ({productId, amount}: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({children}: CartProviderProps): JSX.Element {
    const [cart, setCart] = useState<Product[]>(() => {
        const storagedCart = localStorage.getItem('@RocketShoes:cart')

        if (storagedCart) {
            return JSON.parse(storagedCart);
        }

        return [];
    });

    const addProduct = async (productId: number) => {

        try {

            const isProductOnCart = cart.find((product) => product.id === productId)

            if (!isProductOnCart) {
                const {data: product} = await api.get(`products/${productId}`)
                const {data: stock} = await api.get(`stock/${productId}`)
                if (stock.amount > 0) {
                    const chosenProduct = {...product, amount: 1}
                    setCart([...cart, chosenProduct])
                    localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, chosenProduct]))
                }
            }
            if (isProductOnCart) {
                const {data: stock} = await api.get(`stock/${productId}`)
                if (stock.amount > isProductOnCart.amount) {
                    const chosenProduct = {...isProductOnCart, amount: isProductOnCart.amount++}
                    setCart([...cart, chosenProduct])
                    localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, chosenProduct]))
                } else {
                    toast.error('Quantidade solicitada fora de estoque');
                }
            }
        } catch ({response}) {
            if (response.status === 404) {
                toast.error('Erro na adição do produto');
            }
        }
    };

    const removeProduct = (productId: number) => {
        try {
            const isProductOnCart = cart.find((product) => product.id === productId)
            if (isProductOnCart) {
                const filteredProducts = cart.filter(({id}) => productId !== id)
                setCart(filteredProducts)
                localStorage.setItem('@RocketShoes:cart', JSON.stringify(filteredProducts))
            }
            if (!isProductOnCart) {
                toast.error('Erro na remoção do produto');
            }
        } catch ({response}) {
            if (response.status === 404) {
                toast.error('Erro na remoção do produto');
            }
        }
    };

    const updateProductAmount = async ({productId, amount}: UpdateProductAmount) => {
        try {
            const isProductOnCart = cart.find((product) => product.id === productId)
            const {data: stock} = await api.get(`stock/${productId}`)
            if (amount > 0){
                if (isProductOnCart) {
                    if (stock.amount > 0 && stock.amount >= amount) {
                        const updatedProduct = {...isProductOnCart, amount}
                        setCart([...cart,updatedProduct])
                        localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, updatedProduct]))
                    }else{
                        toast.error('Quantidade solicitada fora de estoque');
                    }
                }
            }
        } catch ({response}) {
            if (response.status === 404) {
                toast.error('Erro na alteração de quantidade do produto');
            }
        }
    };

    return (
        <CartContext.Provider
            value={{cart, addProduct, removeProduct, updateProductAmount}}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart(): CartContextData {
    const context = useContext(CartContext);

    return context;
}
