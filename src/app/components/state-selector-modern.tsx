import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Search, Check } from 'lucide-react';
import { useLanguage } from '../contexts/language-context';
import { US_STATES, STATE_NAMES_ES } from '../data/state-variations';
import { StateCode } from '../data/document-availability';

interface StateSelectorModernProps {
  selectedState: StateCode | 'ALL';
  onStateChange: (state: StateCode | 'ALL') => void;
}

export function StateSelectorModern({ selectedState, onStateChange }: StateSelectorModernProps) {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const getStateName = (code: string) => {
    if (code === 'ALL') return language === 'en' ? 'All States' : 'Todos los Estados';
    return language === 'es' ? STATE_NAMES_ES[code as StateCode] || code : code;
  };

  const filteredStates = ['ALL', ...US_STATES].filter(state => {
    const stateName = getStateName(state).toLowerCase();
    return stateName.includes(searchQuery.toLowerCase());
  });

  return (
    <section className="py-16 bg-white border-y border-slate-200">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4"
            >
              <MapPin className="size-4" />
              {language === 'en' ? 'State-Specific Documents' : 'Documentos Específicos por Estado'}
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-4xl font-bold mb-3"
            >
              {language === 'en' ? 'Select Your State' : 'Selecciona Tu Estado'}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-lg text-slate-600"
            >
              {language === 'en'
                ? 'Get documents that comply with your state\'s specific legal requirements'
                : 'Obtén documentos que cumplan con los requisitos legales específicos de tu estado'}
            </motion.p>
          </div>

          {/* Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="relative"
          >
            {/* Selected State Display */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="w-full bg-gradient-to-br from-slate-50 to-white border-2 border-slate-300 hover:border-blue-500 rounded-2xl p-6 flex items-center justify-between transition-all duration-300 shadow-md hover:shadow-lg group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl group-hover:scale-110 transition-transform">
                  <MapPin className="size-6 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-sm text-slate-500 mb-1">
                    {language === 'en' ? 'Currently showing documents for:' : 'Mostrando documentos para:'}
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {getStateName(selectedState)}
                  </p>
                </div>
              </div>
              <svg
                className={`size-6 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown */}
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute z-50 w-full mt-4 bg-white border-2 border-slate-200 rounded-2xl shadow-2xl overflow-hidden"
                >
                  {/* Search */}
                  <div className="p-4 border-b border-slate-200 bg-slate-50">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                      <input
                        type="text"
                        placeholder={language === 'en' ? 'Search states...' : 'Buscar estados...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* States List */}
                  <div className="max-h-96 overflow-y-auto">
                    {filteredStates.length === 0 ? (
                      <div className="p-8 text-center text-slate-500">
                        {language === 'en' ? 'No states found' : 'No se encontraron estados'}
                      </div>
                    ) : (
                      <div className="p-2">
                        {filteredStates.map((state) => (
                          <button
                            key={state}
                            onClick={() => {
                              onStateChange(state as StateCode | 'ALL');
                              setIsOpen(false);
                              setSearchQuery('');
                            }}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-blue-50 transition-colors ${
                              selectedState === state ? 'bg-blue-100 text-blue-700' : 'text-slate-700'
                            }`}
                          >
                            <span className="font-medium">{getStateName(state)}</span>
                            {selectedState === state && (
                              <Check className="size-5 text-blue-600" strokeWidth={3} />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Backdrop */}
            {isOpen && (
              <div
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                onClick={() => {
                  setIsOpen(false);
                  setSearchQuery('');
                }}
              />
            )}
          </motion.div>

          {/* Info */}
          {selectedState !== 'ALL' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl"
            >
              <p className="text-sm text-blue-800 text-center">
                {language === 'en'
                  ? `Showing documents compliant with ${getStateName(selectedState)} state laws`
                  : `Mostrando documentos que cumplen con las leyes del estado de ${getStateName(selectedState)}`}
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
