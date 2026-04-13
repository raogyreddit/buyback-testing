import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { 
  Plus, Edit2, Trash2, Save, X, Laptop, Tablet, Search, Sliders
} from 'lucide-react'

export default function PriceEngine() {
  const { priceEngineModels, fetchPriceEngine, addPriceModel, updatePriceEngine, deletePriceModel, isLoading } = useStore()
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editPrice, setEditPrice] = useState('')
  const [addForm, setAddForm] = useState({ device_type: 'MacBook', model_name: '', base_price: '' })
  const [msg, setMsg] = useState(null)

  useEffect(() => { fetchPriceEngine() }, [])

  const showMsg = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 3000) }

  const macbooks = priceEngineModels.filter(m => m.device_type === 'MacBook')
  const ipads = priceEngineModels.filter(m => m.device_type === 'iPad')

  const filteredModels = priceEngineModels.filter(model => {
    const matchesFilter = filter === 'all' || model.device_type === filter
    const matchesSearch = !searchQuery || model.model_name?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const handleAdd = async () => {
    if (!addForm.model_name || !addForm.base_price) return
    const success = await addPriceModel(addForm.device_type, addForm.model_name, parseInt(addForm.base_price) || 0)
    if (success) {
      setShowAdd(false)
      setAddForm({ device_type: 'MacBook', model_name: '', base_price: '' })
      showMsg('success', 'Model added successfully')
    }
  }

  const handleEdit = async (id) => {
    const success = await updatePriceEngine(id, { base_price: parseInt(editPrice) || 0 })
    if (success) { setEditingId(null); showMsg('success', 'Price updated') }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return
    const success = await deletePriceModel(id)
    if (success) showMsg('success', 'Model deleted')
  }

  const numToInt = (v) => {
    if (v == null) return 0
    if (typeof v === 'number') return Math.round(v)
    return parseInt(v) || 0
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Price Management</h1>
          <p className="text-gray-500">Manage base prices for device models</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/infra-control/condition-deductions')}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
          >
            <Sliders className="w-4 h-4" />
            Condition Deductions
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Model
          </button>
        </div>
      </div>

      {msg && (
        <div className={`p-3 rounded-xl text-sm ${msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {msg.text}
        </div>
      )}

      {/* Add Model Dialog */}
      {showAdd && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Add Device Price</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Device Type</label>
              <select
                value={addForm.device_type}
                onChange={(e) => setAddForm({ ...addForm, device_type: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="MacBook">MacBook</option>
                <option value="iPad">iPad</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model Name</label>
              <input
                type="text"
                value={addForm.model_name}
                onChange={(e) => setAddForm({ ...addForm, model_name: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., MacBook Air M1 (2020)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Base Price (₹)</label>
              <input
                type="number"
                value={addForm.base_price}
                onChange={(e) => setAddForm({ ...addForm, base_price: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., 45000"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleAdd} className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-medium">Add</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium">Cancel</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search models..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'MacBook', 'iPad'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
                filter === f ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'MacBook' && <Laptop className="w-4 h-4" />}
              {f === 'iPad' && <Tablet className="w-4 h-4" />}
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>
      </div>

      {/* Price List - grouped by device type like Flutter app */}
      {isLoading && priceEngineModels.length === 0 ? (
        <div className="text-center py-16">
          <div className="animate-spin w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Loading prices...</p>
        </div>
      ) : filteredModels.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <Laptop className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No Prices Configured</h3>
          <p className="text-sm text-gray-500 mb-4">Click "Add Model" to add device prices</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* MacBook Section */}
          {filter !== 'iPad' && filteredModels.some(m => m.device_type === 'MacBook') && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Laptop className="w-5 h-5 text-primary-600" />
                <h2 className="text-lg font-bold text-gray-900">MacBook Prices</h2>
              </div>
              <div className="space-y-3">
                {filteredModels.filter(m => m.device_type === 'MacBook').map(model => (
                  <PriceCard
                    key={model.id}
                    model={model}
                    isEditing={editingId === model.id}
                    editPrice={editPrice}
                    setEditPrice={setEditPrice}
                    onStartEdit={() => { setEditingId(model.id); setEditPrice(numToInt(model.base_price).toString()) }}
                    onSave={() => handleEdit(model.id)}
                    onCancel={() => setEditingId(null)}
                    onDelete={() => handleDelete(model.id, model.model_name)}
                    numToInt={numToInt}
                  />
                ))}
              </div>
            </div>
          )}

          {/* iPad Section */}
          {filter !== 'MacBook' && filteredModels.some(m => m.device_type === 'iPad') && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Tablet className="w-5 h-5 text-primary-600" />
                <h2 className="text-lg font-bold text-gray-900">iPad Prices</h2>
              </div>
              <div className="space-y-3">
                {filteredModels.filter(m => m.device_type === 'iPad').map(model => (
                  <PriceCard
                    key={model.id}
                    model={model}
                    isEditing={editingId === model.id}
                    editPrice={editPrice}
                    setEditPrice={setEditPrice}
                    onStartEdit={() => { setEditingId(model.id); setEditPrice(numToInt(model.base_price).toString()) }}
                    onSave={() => handleEdit(model.id)}
                    onCancel={() => setEditingId(null)}
                    onDelete={() => handleDelete(model.id, model.model_name)}
                    numToInt={numToInt}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="font-semibold text-blue-900 mb-2">How Pricing Works</h3>
        <p className="text-sm text-blue-700">
          <strong>Base Price</strong> is the maximum buyback value for each model.
        </p>
        <p className="text-sm text-blue-700 mt-1">
          <strong>Condition Deductions</strong> (managed separately) are subtracted from the base price based on device condition.
        </p>
        <p className="text-sm text-blue-700 mt-1">
          Final Price = Base Price - Sum of applicable condition deductions + Bonuses (warranty, accessories)
        </p>
      </div>
    </div>
  )
}

function PriceCard({ model, isEditing, editPrice, setEditPrice, onStartEdit, onSave, onCancel, onDelete, numToInt }) {
  const basePrice = numToInt(model.base_price)
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-3 py-2.5 hover:shadow-sm transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            model.device_type === 'MacBook' ? 'bg-indigo-100' : 'bg-emerald-100'
          }`}>
            {model.device_type === 'MacBook'
              ? <Laptop className="w-4 h-4 text-indigo-600" />
              : <Tablet className="w-4 h-4 text-emerald-600" />
            }
          </div>
          <div>
            <h3 className="font-medium text-sm text-gray-900">{model.model_name}</h3>
            <p className="text-[10px] text-gray-500">{model.device_type}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500 text-sm">₹</span>
              <input
                type="number"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                className="w-24 px-2 py-1.5 border border-gray-300 rounded-lg text-right text-sm font-semibold outline-none focus:ring-2 focus:ring-primary-500"
                autoFocus
              />
              <button onClick={onSave} className="p-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200">
                <Save className="w-3.5 h-3.5" />
              </button>
              <button onClick={onCancel} className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <>
              <div className="text-right">
                <p className="text-base font-bold text-green-600">₹{basePrice.toLocaleString('en-IN')}</p>
                <p className="text-[10px] text-gray-400">Base Price</p>
              </div>
              <button onClick={onStartEdit} className="p-1.5 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100">
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button onClick={onDelete} className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
