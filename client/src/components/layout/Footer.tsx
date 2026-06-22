import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-slate-800 text-slate-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">
              IAG Hub Services
            </h3>
            <p className="text-sm leading-relaxed">
              Your trusted workplace supply partner for IAG New Zealand. Procurement made simple.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-white transition-colors">
                  Products
                </Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-white transition-colors">
                  Cart
                </Link>
              </li>
              <li>
                <Link to="/admin/tickets" className="hover:text-white transition-colors">
                  Admin — Tickets
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">
              Integration Stack
            </h3>
            <ul className="space-y-1 text-sm">
              <li>Shopify Storefront API (GraphQL)</li>
              <li>ServiceNow ticket automation</li>
              <li>Shopify Order Webhooks</li>
              <li>React + Apollo Client</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-700 pt-8 text-sm text-center text-slate-500">
          © {new Date().getFullYear()} IAG Hub Services — Portfolio project demonstrating Shopify
          headless commerce for a Shopify eCommerce Engineer role.
        </div>
      </div>
    </footer>
  );
}
