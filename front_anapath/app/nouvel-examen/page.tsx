'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import axios from 'axios';

export default function NouvelExamenPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [anaType, setAnaType] = useState('fcv');
  const [urgence, setUrgence] = useState('n');
  
  const [formData, setFormData] = useState({
    serviceDemandeur: '',
    renseignementsCliniques: '',
    precautions: '',
    fcvGpa: '',
    fcvDdr: '',
    fcvMenopause: '',
    fcvMenarche: '',
    fcvPremierRapport: '',
    fcvContraception: '',
    fcvTraitement: '',
    fcvExamensAnterieursLieu: '',
    fcvExamensAnterieursNombre: '',
    fcvExamensAnterieursDate: '',
    fcvExamensAnterieursResultat: '',
    fcvAntecedents: '',
    fcvMethode: 'Spatule + brosse',
    fcvSymptomes: '',
    cytoSiege: '',
    cytoOrgane: '',
    cytoFixateur: 'Cytofixe',
    cytoFixateurAutre: '',
    cytoNotes: '',
    liqNature: '',
    liqNatureAutre: '',
    liqUniteSoins: '',
    liqNotes: '',
    bioExamensAnterieurs: '',
    bioResultatsAnterieurs: '',
    bioGpa: '',
    bioDdr: '',
    bioMenopause: '',
    bioAntecedents: '',
    bioDatePrelevement: '',
    bioFixateur: 'Formol 10%',
    bioOrgane: '',
    bioNature: 'Biopsie',
    bioNatureAutre: '',
    bioSuspicion: '',
    bioFaitA: '',
    bioLe: '',
    extChirurgien: '',
    extPosteTel: '',
    extIntervention: '',
    extNature: 'Tissu frais',
    extOrgane: '',
    extQuestion: '',
    extHeure: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let prelevement: any = {};
      let typeExamen = '';
      
      switch (anaType) {
        case 'fcv':
          typeExamen = 'FCV_PAP';
          prelevement = { type: 'FCV / Pap test', urgence, ...formData };
          break;
        case 'cyto':
          typeExamen = 'CYT0PONCTION';
          prelevement = { type: 'Cytoponction', urgence, ...formData };
          break;
        case 'liq':
          typeExamen = 'LIQUIDE';
          prelevement = { type: 'Liquide', urgence, ...formData };
          break;
        case 'bio':
          typeExamen = 'BIOPSIE';
          prelevement = { type: 'Biopsie', urgence, ...formData };
          break;
        default:
          typeExamen = 'EXTEMPORANE_STAT';
          prelevement = { type: 'Extemporané', urgence: 'tu', ...formData };
      }
      
      const apiData = {
        patientId: `TEMP-${Date.now()}`,
        typeExamen: typeExamen,
        isExtemporane: anaType === 'ext',
        prelevement: prelevement,
      };
      
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/anapath`, apiData);
      
      if (response.status === 201) {
        alert(`✅ Demande créée ! ID: ${response.data.anapathId}`);
        router.push('/worklist');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('❌ Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const getUrgenceClass = () => {
    if (urgence === 'n') return 'border-green-200 bg-green-50';
    if (urgence === 'u') return 'border-yellow-400 bg-yellow-50';
    return 'border-red-500 bg-red-50';
  };

  return (
    <div className="flex min-h-screen bg-[#f8f9fb] text-[#191c1e]">
      <div className="fixed inset-0 grain-overlay z-[60] pointer-events-none"></div>
      <Sidebar />
      
      <main className="flex-1 ml-64 min-h-screen flex flex-col w-[calc(100%-256px)]">
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl flex justify-between items-center px-6 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#00478d] flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-sm">biotech</span>
            </div>
            <h1 className="font-bold text-[#00478d]">Nouvelle demande - Anatomie Pathologique</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#00478d]/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#00478d] text-sm">person</span>
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 w-full max-w-4xl mx-auto">
          
          {/* Degré d'urgence */}
          <div className={`${getUrgenceClass()} p-4 rounded-xl border-2 mb-6 transition-all`}>
            <label className="text-xs font-bold text-[#424752] uppercase block mb-2">Degré d'urgence *</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="urgence" value="n" checked={urgence === 'n'} onChange={(e) => setUrgence(e.target.value)} className="accent-green-600" />
                <span>Normal</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="urgence" value="u" checked={urgence === 'u'} onChange={(e) => setUrgence(e.target.value)} className="accent-yellow-600" />
                <span>Urgent</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="urgence" value="tu" checked={urgence === 'tu'} onChange={(e) => setUrgence(e.target.value)} className="accent-red-600" />
                <span>STAT (Extemporané)</span>
              </label>
            </div>
            <div className="mt-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-red-600 text-sm">warning</span>
                <span className="text-xs font-bold text-red-600 uppercase">Précautions & Alertes</span>
              </div>
              <textarea
                name="precautions"
                value={formData.precautions}
                onChange={handleChange}
                rows={2}
                className="w-full border border-red-200 bg-red-50 rounded-lg px-3 py-2 text-sm"
                placeholder="Risque infectieux, précautions particulières..."
              />
            </div>
          </div>

          {/* Type d'examen */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-outline-variant/20 mb-6">
            <label className="text-xs font-bold text-[#424752] uppercase block mb-3">Type d'examen *</label>
            <div className="flex flex-wrap gap-2">
              {['fcv', 'cyto', 'liq', 'bio', 'ext'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setAnaType(type)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    anaType === type ? 'bg-[#00478d] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {type === 'fcv' && 'FCV / Pap test'}
                  {type === 'cyto' && 'Cytoponction'}
                  {type === 'liq' && 'Liquide'}
                  {type === 'bio' && 'Biopsie'}
                  {type === 'ext' && 'Extemporané (STAT)'}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Renseignements cliniques communs */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-outline-variant/20">
              <h3 className="font-bold text-primary mb-4">📋 Renseignements cliniques</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#424752] uppercase">Unité / Service demandeur *</label>
                  <input name="serviceDemandeur" value={formData.serviceDemandeur} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" type="text" placeholder="Service clinique prescripteur" required />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#424752] uppercase">Renseignements cliniques *</label>
                  <textarea name="renseignementsCliniques" value={formData.renseignementsCliniques} onChange={handleChange} rows={3} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="Contexte clinique, suspicion diagnostique, résultats d'imagerie..." required />
                </div>
              </div>
            </div>

            {/* FCV */}
            {anaType === 'fcv' && (
              <div className="bg-white p-5 rounded-xl shadow-sm border border-outline-variant/20">
                <h3 className="font-bold text-primary mb-4">🔬 FCV / Pap test</h3>
                <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-700 mb-4">
                  <span className="material-symbols-outlined text-sm align-middle mr-1">info</span>
                  Les informations personnelles sont rattachées via l'ID.Seules les données gynécologiques et cliniques sont nécessaires ici.
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="text-xs font-bold uppercase">G P A</label><input name="fcvGpa" value={formData.fcvGpa} onChange={handleChange} className="w-full border rounded-lg p-2 text-sm mt-1" placeholder="G3 P2 A1" /></div>
                  <div><label className="text-xs font-bold uppercase">DDR</label><input name="fcvDdr" value={formData.fcvDdr} onChange={handleChange} className="w-full border rounded-lg p-2 text-sm mt-1" type="date" /></div>
                  <div><label className="text-xs font-bold uppercase">Ménopause</label><select name="fcvMenopause" value={formData.fcvMenopause} onChange={handleChange} className="w-full border rounded-lg p-2 text-sm mt-1"><option>--</option><option>OUI</option><option>NON</option></select></div>
                  <div><label className="text-xs font-bold uppercase">Âge ménarche</label><input name="fcvMenarche" value={formData.fcvMenarche} onChange={handleChange} className="w-full border rounded-lg p-2 text-sm mt-1" type="text" /></div>
                  <div><label className="text-xs font-bold uppercase">1er rapport sexuel</label><input name="fcvPremierRapport" value={formData.fcvPremierRapport} onChange={handleChange} className="w-full border rounded-lg p-2 text-sm mt-1" type="text" /></div>
                  <div><label className="text-xs font-bold uppercase">Contraception</label><input name="fcvContraception" value={formData.fcvContraception} onChange={handleChange} className="w-full border rounded-lg p-2 text-sm mt-1" type="text" /></div>
                  <div><label className="text-xs font-bold uppercase">Traitement</label><input name="fcvTraitement" value={formData.fcvTraitement} onChange={handleChange} className="w-full border rounded-lg p-2 text-sm mt-1" type="text" /></div>
                </div>
                <div className="mt-4">
                  <label className="text-xs font-bold uppercase">Antécédents</label>
                  <textarea name="fcvAntecedents" value={formData.fcvAntecedents} onChange={handleChange} rows={2} className="w-full border rounded-lg p-2 text-sm mt-1" />
                </div>
                <div className="mt-4">
                  <label className="text-xs font-bold uppercase">Méthode</label>
                  <div className="flex gap-4 mt-1">
                    <label className="flex items-center gap-2"><input type="radio" name="fcvMethode" value="Spatule + brosse" checked={formData.fcvMethode === 'Spatule + brosse'} onChange={handleChange} /> Spatule + brosse</label>
                    <label className="flex items-center gap-2"><input type="radio" name="fcvMethode" value="Milieu liquide" checked={formData.fcvMethode === 'Milieu liquide'} onChange={handleChange} /> Milieu liquide</label>
                  </div>
                </div>
              </div>
            )}

            {/* Bouton validation */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#00478d] to-[#005eb8] text-white py-4 rounded-xl font-bold shadow-md flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined">send</span>
              {loading ? 'ENVOI EN COURS...' : 'ENVOYER LA DEMANDE'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}