import { describe, it, expect } from 'vitest';
import {
  isValidSenegalMobile,
  buildSmsSchemeUrl,
  buildWhatsAppUrl,
  buildPublicUrl,
} from './share';
import {
  LOCATION_TYPE_LABELS,
  LOCATION_TYPES,
  getLocationTypeLabel,
} from './locationTypes';
import {
  validateStep1Position,
  validateStep2Details,
  validateStep3Photo,
} from './formValidation';
import { formatFileSize } from './imageCompressor';

describe('1. Validation des numéros mobiles sénégalais (isValidSenegalMobile)', () => {
  it('accepte les numéros mobiles valides avec préfixes 70, 75, 76, 77, 78', () => {
    expect(isValidSenegalMobile('+221701234567')).toBe(true);
    expect(isValidSenegalMobile('+221759876543')).toBe(true);
    expect(isValidSenegalMobile('+221764567890')).toBe(true);
    expect(isValidSenegalMobile('+221771234567')).toBe(true);
    expect(isValidSenegalMobile('+221789012345')).toBe(true);
  });

  it('rejette les préfixes de ligne fixe (33 et +33)', () => {
    expect(isValidSenegalMobile('+221338210000')).toBe(false);
    expect(isValidSenegalMobile('+221338670000')).toBe(false);
    expect(isValidSenegalMobile('338210000')).toBe(false);
    expect(isValidSenegalMobile('+33612345678')).toBe(false);
  });

  it('rejette les numéros incomplets, invalides ou sans indicatif +221', () => {
    expect(isValidSenegalMobile('771234567')).toBe(false);
    expect(isValidSenegalMobile('+22177123456')).toBe(false);
    expect(isValidSenegalMobile('+2217712345678')).toBe(false);
    expect(isValidSenegalMobile('+221791234567')).toBe(false); // préfixe 79 inexistant
    expect(isValidSenegalMobile('')).toBe(false);
    expect(isValidSenegalMobile('texte-invalide')).toBe(false);
  });
});

describe('2. Utilitaires de partage et URLs (share)', () => {
  it('construit un lien SMS natif compatible avec format sms:?&body=', () => {
    const text = "Mon adresse SamaAdresse : ZIG-KBG-4271";
    const url = buildSmsSchemeUrl(text);
    expect(url).toBe(`sms:?&body=${encodeURIComponent(text)}`);
    expect(url).toContain('sms:?&body=');
  });

  it('construit un lien WhatsApp valide wa.me', () => {
    const text = "Consultez ma plaque ZIG-KBG-4271";
    const url = buildWhatsAppUrl(text);
    expect(url).toBe(`https://wa.me/?text=${encodeURIComponent(text)}`);
  });

  it('construit une URL publique canonique pour la fiche', () => {
    const code = 'ZIG-KBG-4271';
    const url = buildPublicUrl(code);
    expect(url).toContain(`/a/${code}`);
  });
});

describe('3. Table des libellés de type de lieu (locationTypes)', () => {
  it('mappe correctement MAISON -> Maison, COMMERCE -> Commerce, INSTITUTION -> Institution', () => {
    expect(LOCATION_TYPE_LABELS.MAISON).toBe('Maison');
    expect(LOCATION_TYPE_LABELS.COMMERCE).toBe('Commerce');
    expect(LOCATION_TYPE_LABELS.INSTITUTION).toBe('Institution');
  });

  it('fournit les libellés via la fonction utilitaire getLocationTypeLabel', () => {
    expect(getLocationTypeLabel('MAISON')).toBe('Maison');
    expect(getLocationTypeLabel('maison')).toBe('Maison');
    expect(getLocationTypeLabel('COMMERCE')).toBe('Commerce');
    expect(getLocationTypeLabel('INSTITUTION')).toBe('Institution');
    expect(getLocationTypeLabel('AUTRE')).toBe('AUTRE');
    expect(getLocationTypeLabel(null)).toBe('');
  });

  it('exporte la liste des 3 types ordonnés', () => {
    expect(LOCATION_TYPES).toHaveLength(3);
    expect(LOCATION_TYPES.map((t) => t.id)).toEqual(['MAISON', 'COMMERCE', 'INSTITUTION']);
    expect(LOCATION_TYPES.map((t) => t.label)).toEqual(['Maison', 'Commerce', 'Institution']);
  });
});

describe('4. Validation de chaque étape du formulaire (formValidation)', () => {
  describe('Étape 1 : Position GPS', () => {
    it('valide des coordonnées géographiques valides', () => {
      const res = validateStep1Position(12.5833, -16.2719);
      expect(res.isValid).toBe(true);
      expect(res.error).toBeUndefined();
    });

    it('refuse les valeurs nulles, indéfinies ou NaN', () => {
      expect(validateStep1Position(null, -16.2719).isValid).toBe(false);
      expect(validateStep1Position(12.5833, null).isValid).toBe(false);
      expect(validateStep1Position(undefined, -16.2719).isValid).toBe(false);
      expect(validateStep1Position(Number.NaN, -16.2719).isValid).toBe(false);
    });

    it('refuse les coordonnées hors limites géographiques terrestres', () => {
      expect(validateStep1Position(95, -16.2719).isValid).toBe(false);
      expect(validateStep1Position(-95, -16.2719).isValid).toBe(false);
      expect(validateStep1Position(12.5833, 195).isValid).toBe(false);
      expect(validateStep1Position(12.5833, -195).isValid).toBe(false);
    });
  });

  describe('Étape 2 : Détails du lieu', () => {
    it('valide avec un type valide et une description concise', () => {
      const res = validateStep2Details('MAISON', 'Portail bleu face à la mosquée');
      expect(res.isValid).toBe(true);
      expect(res.error).toBeUndefined();
    });

    it('refuse un type de lieu inconnu', () => {
      const res = validateStep2Details('INCONNU', 'Description valide');
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('type de lieu valide');
    });

    it('refuse une description vide ou composée uniquement despaces', () => {
      const res = validateStep2Details('MAISON', '   ');
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('obligatoire');
    });

    it('refuse une description excédant 500 caractères', () => {
      const longText = 'a'.repeat(501);
      const res = validateStep2Details('MAISON', longText);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('500');
    });
  });

  describe('Étape 3 : Photo (facultative)', () => {
    it('accepte labsence de photo (étape facultative)', () => {
      expect(validateStep3Photo(null).isValid).toBe(true);
      expect(validateStep3Photo(undefined).isValid).toBe(true);
    });

    it('accepte une image JPEG, PNG ou WebP valide', () => {
      const file = new File(['fake-bytes'], 'photo.jpg', { type: 'image/jpeg' });
      expect(validateStep3Photo(file).isValid).toBe(true);
    });

    it('refuse les types MIME non image autorisés', () => {
      const file = new File(['fake-bytes'], 'doc.pdf', { type: 'application/pdf' });
      const res = validateStep3Photo(file);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('Format non supporté');
    });
  });

  describe('5. Formatage des tailles de fichiers pour optimisation (imageCompressor)', () => {
    it('formate correctement les octets, kilo-octets et méga-octets', () => {
      expect(formatFileSize(500)).toBe('500 o');
      expect(formatFileSize(1024)).toBe('1.0 Ko');
      expect(formatFileSize(450 * 1024)).toBe('450.0 Ko');
      expect(formatFileSize(3.8 * 1024 * 1024)).toBe('3.8 Mo');
    });
  });
});
