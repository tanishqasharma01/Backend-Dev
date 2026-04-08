const express = require('express');
const session = require('express-session');

const app = express();
app.use(express.json());

// Configure Session Middleware
app.use(session({
    secret: 'cart-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // Cart persists for 24 hours
}));

// Initialize cart middleware
const initCart = (req, res, next) => {
    if (!req.session.cart) {
        // If no cart exists in this session, create an empty one
        req.session.cart = { items: [], total: 0 };
    }
    next();
};
app.use(initCart);

// Helper function: Calculate total price
const calculateTotal = (cart) => {
    return cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
};

// 1. Add items to cart
app.post('/cart/add', (req, res) => {
    const { productId, name, price, quantity } = req.body;
    const cart = req.session.cart;

    // Check if item already exists
    const existingItem = cart.items.find(item => item.productId === productId);
    
    if (existingItem) {
        existingItem.quantity += quantity; // Update quantity if exists
    } else {
        cart.items.push({ productId, name, price, quantity }); // Add new item
    }
    
    cart.total = calculateTotal(cart); // Update total
    res.status(200).json({ message: "Item added to cart", cart });
});

// 2. Update item quantities
app.put('/cart/update/:productId', (req, res) => {
    const productId = req.params.productId;
    const { quantity } = req.body;
    const cart = req.session.cart;

    const item = cart.items.find(item => item.productId === productId);
    
    if (item) {
        item.quantity = quantity;
        cart.total = calculateTotal(cart);
        res.status(200).json({ message: "Cart updated", cart });
    } else {
        res.status(404).json({ error: "Item not found in cart" });
    }
});

// 3. Remove items from cart
app.delete('/cart/remove/:productId', (req, res) => {
    const productId = req.params.productId;
    const cart = req.session.cart;

    // Filter out the item to be removed
    cart.items = cart.items.filter(item => item.productId !== productId);
    cart.total = calculateTotal(cart);

    res.status(200).json({ message: "Item removed", cart });
});

// 4. View Cart
app.get('/cart', (req, res) => {
    res.status(200).json({ cart: req.session.cart });
});

// 5. Clear cart
app.delete('/cart/clear', (req, res) => {
    req.session.cart = { items: [], total: 0 };
    res.status(200).json({ message: "Cart cleared completely", cart: req.session.cart });
});

app.listen(3000, () => {
    console.log("Cart Server running on port 3000");
});