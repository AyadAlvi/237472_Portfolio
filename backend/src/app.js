const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/auth');
const vendorRoutes = require('./routes/vendors');
const productRoutes = require('./routes/products');
const blogRoutes = require('./routes/blog');
const cartRoutes = require('./routes/cart');
const customRoutes = require('./routes/customizations');
const profileRoutes = require('./routes/profile');
const orderRoutes = require('./routes/orders');
const vendorDashboardRoutes = require('./routes/vendor');
const errorHandler = require('./middleware/errorHandler');
const { notFound } = require('./utils/errors');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.use('/api/auth', authRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/products', productRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/customizations', customRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/vendor', vendorDashboardRoutes);

app.use((_req, _res, next) => next(notFound('Route not found')));
app.use(errorHandler);

module.exports = app;
