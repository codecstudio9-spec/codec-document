# 🎛️ PANEL DE ADMINISTRACIÓN - CODEC DOCUMENT

## 📋 Especificaciones Completas para Desarrollo

---

## 🎯 Objetivo

Crear un panel de administración completo para que **Douglas Taborda** pueda:
1. Gestionar plantillas de documentos (crear, editar, eliminar)
2. Ajustar precios dinámicamente
3. Editar campos personalizables
4. Modificar contenido de la landing page
5. Ver analytics y métricas de ventas
6. Gestionar disponibilidad por estado

---

## 🏗️ Arquitectura del Admin Panel

```
/admin
├── /dashboard              → Vista general (analytics)
├── /templates              → Gestor de plantillas
│   ├── /new                → Crear nueva plantilla
│   └── /edit/:id           → Editar plantilla existente
├── /landing                → Editor de landing page
├── /sales                  → Historial de ventas
├── /settings               → Configuración general
└── /login                  → Autenticación
```

---

## 🔐 1. AUTENTICACIÓN

### Requisitos

- ✅ Solo Douglas Taborda puede acceder
- ✅ Email + Password
- ✅ 2FA opcional (Google Authenticator)
- ✅ Sesiones seguras (JWT)
- ✅ Auto-logout después de 30 minutos de inactividad

### Implementación Sugerida

```typescript
// /src/app/contexts/admin-auth-context.tsx
import { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin';
}

interface AdminAuthContextType {
  user: AdminUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const token = Cookies.get('admin_token');
    if (token) {
      verifyToken(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // Call your authentication API
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) throw new Error('Invalid credentials');

      const data = await response.json();
      
      // Store token
      Cookies.set('admin_token', data.token, { 
        expires: 7, // 7 days
        secure: true,
        sameSite: 'strict'
      });

      setUser(data.user);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    Cookies.remove('admin_token');
    setUser(null);
  };

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch('/api/admin/verify', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        logout();
      }
    } catch (error) {
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminAuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated: !!user,
      isLoading
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return context;
}
```

### Página de Login

```typescript
// /src/app/pages/admin-login.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAdminAuth } from '../contexts/admin-auth-context';
import { Shield, Lock, Mail } from 'lucide-react';
import { Button } from '../components/ui/button';

export function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAdminAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/admin/dashboard');
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl">
              <Shield className="size-12 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center mb-2">Admin Panel</h1>
          <p className="text-slate-600 text-center mb-8">Codec Document</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="douglas@codecdocument.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-lg font-semibold"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
```

---

## 📊 2. DASHBOARD PRINCIPAL

### Vista General

```typescript
// /src/app/pages/admin-dashboard.tsx
import { useState, useEffect } from 'react';
import { 
  DollarSign, 
  FileText, 
  Users, 
  TrendingUp,
  Download,
  ShoppingCart
} from 'lucide-react';

interface DashboardStats {
  totalRevenue: number;
  totalSales: number;
  documentsGenerated: number;
  conversionRate: number;
  topDocuments: Array<{
    id: string;
    name: string;
    sales: number;
    revenue: number;
  }>;
  recentTransactions: Array<{
    id: string;
    documentName: string;
    amount: number;
    date: string;
    status: 'completed' | 'pending' | 'failed';
  }>;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    fetchStats(timeRange);
  }, [timeRange]);

  const fetchStats = async (range: string) => {
    const response = await fetch(`/api/admin/stats?range=${range}`);
    const data = await response.json();
    setStats(data);
  };

  if (!stats) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-slate-600">Welcome back, Douglas</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Time Range Selector */}
        <div className="mb-8 flex gap-2">
          {['7d', '30d', '90d', 'all'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              {range === 'all' ? 'All Time' : `Last ${range}`}
            </button>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={DollarSign}
            title="Total Revenue"
            value={`$${stats.totalRevenue.toFixed(2)}`}
            change="+12.5%"
            trend="up"
          />
          <StatCard
            icon={ShoppingCart}
            title="Total Sales"
            value={stats.totalSales.toString()}
            change="+8.3%"
            trend="up"
          />
          <StatCard
            icon={FileText}
            title="Documents Generated"
            value={stats.documentsGenerated.toString()}
            change="+15.2%"
            trend="up"
          />
          <StatCard
            icon={TrendingUp}
            title="Conversion Rate"
            value={`${stats.conversionRate.toFixed(1)}%`}
            change="+2.1%"
            trend="up"
          />
        </div>

        {/* Top Documents */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4">Top Selling Documents</h2>
            <div className="space-y-4">
              {stats.topDocuments.map((doc, idx) => (
                <div key={doc.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center font-bold text-blue-600">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-sm text-slate-500">{doc.sales} sales</p>
                    </div>
                  </div>
                  <p className="font-bold text-green-600">${doc.revenue.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4">Recent Transactions</h2>
            <div className="space-y-4">
              {stats.recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{tx.documentName}</p>
                    <p className="text-sm text-slate-500">{new Date(tx.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${tx.amount.toFixed(2)}</p>
                    <span className={`text-xs px-2 py-1 rounded ${
                      tx.status === 'completed' 
                        ? 'bg-green-100 text-green-700'
                        : tx.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, title, value, change, trend }: any) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-blue-100 rounded-lg">
          <Icon className="size-6 text-blue-600" />
        </div>
        <span className={`text-sm font-medium ${
          trend === 'up' ? 'text-green-600' : 'text-red-600'
        }`}>
          {change}
        </span>
      </div>
      <h3 className="text-slate-600 text-sm mb-1">{title}</h3>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}
```

---

## 📝 3. GESTOR DE PLANTILLAS

### Lista de Plantillas

```typescript
// /src/app/pages/admin-templates.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Plus, Edit, Trash, DollarSign } from 'lucide-react';
import { DocumentTemplate } from '../types/document';

export function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    const response = await fetch('/api/admin/templates');
    const data = await response.json();
    setTemplates(data);
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    await fetch(`/api/admin/templates/${id}`, { method: 'DELETE' });
    fetchTemplates();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Templates</h1>
            <p className="text-slate-600">Manage your legal document templates</p>
          </div>
          <Link to="/admin/templates/new">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <Plus className="size-5" />
              New Template
            </button>
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left p-4 font-semibold">Document Name</th>
                <th className="text-left p-4 font-semibold">Category</th>
                <th className="text-left p-4 font-semibold">Price</th>
                <th className="text-left p-4 font-semibold">Fields</th>
                <th className="text-left p-4 font-semibold">Status</th>
                <th className="text-right p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {templates.map((template) => (
                <tr key={template.id} className="hover:bg-slate-50">
                  <td className="p-4 font-medium">{template.name}</td>
                  <td className="p-4 text-slate-600">{template.category}</td>
                  <td className="p-4">
                    <span className="font-bold text-green-600">${template.price}</span>
                  </td>
                  <td className="p-4 text-slate-600">{template.fields.length}</td>
                  <td className="p-4">
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      Active
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link to={`/admin/templates/edit/${template.id}`}>
                        <button className="p-2 hover:bg-slate-100 rounded-lg">
                          <Edit className="size-5 text-blue-600" />
                        </button>
                      </Link>
                      <button
                        onClick={() => deleteTemplate(template.id)}
                        className="p-2 hover:bg-slate-100 rounded-lg"
                      >
                        <Trash className="size-5 text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

### Editor de Plantilla

```typescript
// /src/app/pages/admin-template-editor.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Save, Plus, Trash, ArrowLeft } from 'lucide-react';
import { DocumentTemplate, FieldDefinition } from '../types/document';

export function AdminTemplateEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState<Partial<DocumentTemplate>>({
    name: '',
    description: '',
    category: 'Business & Contracts',
    price: 9.99,
    fields: [],
    template: ''
  });

  useEffect(() => {
    if (id && id !== 'new') {
      fetchTemplate(id);
    }
  }, [id]);

  const fetchTemplate = async (templateId: string) => {
    const response = await fetch(`/api/admin/templates/${templateId}`);
    const data = await response.json();
    setTemplate(data);
  };

  const saveTemplate = async () => {
    const method = id === 'new' ? 'POST' : 'PUT';
    const url = id === 'new' 
      ? '/api/admin/templates' 
      : `/api/admin/templates/${id}`;

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(template)
    });

    navigate('/admin/templates');
  };

  const addField = () => {
    setTemplate(prev => ({
      ...prev,
      fields: [
        ...(prev.fields || []),
        {
          id: `field_${Date.now()}`,
          label: 'New Field',
          type: 'text',
          required: false
        }
      ]
    }));
  };

  const updateField = (index: number, updates: Partial<FieldDefinition>) => {
    setTemplate(prev => ({
      ...prev,
      fields: prev.fields?.map((field, i) => 
        i === index ? { ...field, ...updates } : field
      )
    }));
  };

  const removeField = (index: number) => {
    setTemplate(prev => ({
      ...prev,
      fields: prev.fields?.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate('/admin/templates')}
              className="p-2 hover:bg-slate-100 rounded-lg"
            >
              <ArrowLeft className="size-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold">
                {id === 'new' ? 'New Template' : 'Edit Template'}
              </h1>
              <p className="text-slate-600">Create or modify a document template</p>
            </div>
          </div>
          <button
            onClick={saveTemplate}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Save className="size-5" />
            Save Template
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Basic Info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold mb-6">Basic Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Document Name</label>
                <input
                  type="text"
                  value={template.name}
                  onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={template.description}
                  onChange={(e) => setTemplate(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select
                    value={template.category}
                    onChange={(e) => setTemplate(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option>Business & Contracts</option>
                    <option>Real Estate</option>
                    <option>Financial & Legal</option>
                    <option>Sales</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={template.price}
                    onChange={(e) => setTemplate(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Fields Editor */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Fields</h2>
              <button
                onClick={addField}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <Plus className="size-4" />
                Add Field
              </button>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {template.fields?.map((field, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Field {index + 1}</h3>
                    <button
                      onClick={() => removeField(index)}
                      className="text-red-600 hover:bg-red-50 p-1 rounded"
                    >
                      <Trash className="size-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Field ID</label>
                      <input
                        type="text"
                        value={field.id}
                        onChange={(e) => updateField(index, { id: e.target.value })}
                        className="w-full px-3 py-2 border rounded text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Label</label>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => updateField(index, { label: e.target.value })}
                        className="w-full px-3 py-2 border rounded text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm font-medium mb-1">Type</label>
                        <select
                          value={field.type}
                          onChange={(e) => updateField(index, { type: e.target.value as any })}
                          className="w-full px-3 py-2 border rounded text-sm"
                        >
                          <option value="text">Text</option>
                          <option value="textarea">Textarea</option>
                          <option value="email">Email</option>
                          <option value="tel">Phone</option>
                          <option value="date">Date</option>
                          <option value="select">Select</option>
                          <option value="currency">Currency</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Required</label>
                        <select
                          value={field.required ? 'true' : 'false'}
                          onChange={(e) => updateField(index, { required: e.target.value === 'true' })}
                          className="w-full px-3 py-2 border rounded text-sm"
                        >
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Template Editor */}
        <div className="bg-white rounded-xl shadow-sm p-6 mt-8">
          <h2 className="text-xl font-bold mb-6">Template Content (Handlebars)</h2>
          <textarea
            value={template.template}
            onChange={(e) => setTemplate(prev => ({ ...prev, template: e.target.value }))}
            className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
            rows={20}
            placeholder="Enter your Handlebars template here..."
          />
          <p className="text-sm text-slate-500 mt-2">
            Use Handlebars syntax: {`{{field_id}}`} for simple fields, {`{{#if field_id}}...{{/if}}`} for conditionals
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

## 🎨 4. EDITOR DE LANDING PAGE

```typescript
// /src/app/pages/admin-landing-editor.tsx
import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';

interface LandingContent {
  heroTitle: { en: string; es: string };
  heroSubtitle: { en: string; es: string };
  features: Array<{
    icon: string;
    title: { en: string; es: string };
    description: { en: string; es: string };
  }>;
  comparisonTable: {
    title: { en: string; es: string };
    subtitle: { en: string; es: string };
  };
}

export function AdminLandingEditor() {
  const [content, setContent] = useState<LandingContent | null>(null);

  useEffect(() => {
    fetchLandingContent();
  }, []);

  const fetchLandingContent = async () => {
    const response = await fetch('/api/admin/landing-content');
    const data = await response.json();
    setContent(data);
  };

  const saveLandingContent = async () => {
    await fetch('/api/admin/landing-content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(content)
    });
    alert('Landing page content saved!');
  };

  if (!content) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Landing Page Editor</h1>
            <p className="text-slate-600">Customize your homepage content</p>
          </div>
          <button
            onClick={saveLandingContent}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Save className="size-5" />
            Save Changes
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Hero Section */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold mb-6">Hero Section</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Title (English)</label>
                <textarea
                  value={content.heroTitle.en}
                  onChange={(e) => setContent(prev => ({
                    ...prev!,
                    heroTitle: { ...prev!.heroTitle, en: e.target.value }
                  }))}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Title (Español)</label>
                <textarea
                  value={content.heroTitle.es}
                  onChange={(e) => setContent(prev => ({
                    ...prev!,
                    heroTitle: { ...prev!.heroTitle, es: e.target.value }
                  }))}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Subtitle (English)</label>
                <textarea
                  value={content.heroSubtitle.en}
                  onChange={(e) => setContent(prev => ({
                    ...prev!,
                    heroSubtitle: { ...prev!.heroSubtitle, en: e.target.value }
                  }))}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Subtitle (Español)</label>
                <textarea
                  value={content.heroSubtitle.es}
                  onChange={(e) => setContent(prev => ({
                    ...prev!,
                    heroSubtitle: { ...prev!.heroSubtitle, es: e.target.value }
                  }))}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold mb-6">Features Section</h2>
            {/* Add feature editors here */}
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 🗄️ 5. BASE DE DATOS (Supabase)

### Schema Sugerido

```sql
-- Templates Table
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  price DECIMAL(10, 2) NOT NULL,
  fields JSONB NOT NULL,
  template_content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Transactions Table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paypal_order_id VARCHAR(255) UNIQUE NOT NULL,
  template_id UUID REFERENCES templates(id),
  user_email VARCHAR(255),
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Landing Content Table
CREATE TABLE landing_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_key VARCHAR(100) UNIQUE NOT NULL,
  content_en TEXT,
  content_es TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Analytics Table
CREATE TABLE analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(100) NOT NULL,
  template_id UUID REFERENCES templates(id),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📈 6. ANALYTICS Y REPORTES

Incluir:
- Revenue por día/semana/mes
- Documentos más vendidos
- Conversion rate (preview → purchase)
- Estados con más ventas
- Gráficos interactivos (Chart.js o Recharts)

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Fase 1 - Core Admin (2-3 semanas)
- [ ] Autenticación (login/logout)
- [ ] Dashboard con stats básicas
- [ ] Lista de plantillas existentes
- [ ] Editor básico de precios

### Fase 2 - Template Management (3-4 semanas)
- [ ] CRUD completo de plantillas
- [ ] Editor de campos
- [ ] Preview de plantillas
- [ ] Gestor de disponibilidad por estado

### Fase 3 - Landing Editor (2 semanas)
- [ ] Editor de hero section
- [ ] Editor de features
- [ ] Upload de videos/imágenes
- [ ] Preview live de cambios

### Fase 4 - Analytics (1-2 semanas)
- [ ] Dashboard de ventas
- [ ] Reportes exportables
- [ ] Gráficos interactivos
- [ ] Email notifications

---

**Tiempo estimado total**: 8-11 semanas  
**Stack recomendado**: React + TypeScript + Supabase + Tailwind

¡Listo para comenzar el desarrollo! 🚀
