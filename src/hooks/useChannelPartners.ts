/**
 * Channel Partners hook
 * Provides Channel Partner data management
 * TODO: Replace mock data with actual API calls
 */

import { useState, useEffect } from 'react';

/**
 * Channel Partner interface
 */
export interface ChannelPartner {
  id: string;
  name: string;
  email: string;
  phone: string;
  territory?: string;
  status: 'active' | 'inactive' | 'pending';
  totalLeads?: number;
  address?: string;
  createdAt?: string;
  lastActivity?: string;
}

/**
 * Hook return type
 */
interface UseChannelPartnersReturn {
  channelPartners: ChannelPartner[];
  activeChannelPartners: ChannelPartner[];
  isLoading: boolean;
  error: string | null;
  refreshChannelPartners: () => void;
  getChannelPartnerById: (id: string) => ChannelPartner | undefined;
}

/**
 * Mock data - TODO: Replace with API call
 */
const mockChannelPartners: ChannelPartner[] = [
  {
    id: 'CP-001',
    name: 'Solar Solutions Delhi',
    email: 'contact@solarsolutions.com',
    phone: '+91-9876543210',
    territory: 'North',
    status: 'active',
    totalLeads: 45,
    address: 'Delhi, India',
    createdAt: '2024-01-15T00:00:00Z',
    lastActivity: '2024-01-20T10:30:00Z',
  },
  {
    id: 'CP-002',
    name: 'Green Energy Mumbai',
    email: 'info@greenenergy.com',
    phone: '+91-8765432109',
    territory: 'West',
    status: 'active',
    totalLeads: 32,
    address: 'Mumbai, India',
    createdAt: '2024-01-10T00:00:00Z',
    lastActivity: '2024-01-19T15:45:00Z',
  },
  {
    id: 'CP-003',
    name: 'Eco Power Chennai',
    email: 'sales@ecopower.com',
    phone: '+91-7654321098',
    territory: 'South',
    status: 'active',
    totalLeads: 28,
    address: 'Chennai, India',
    createdAt: '2024-01-12T00:00:00Z',
    lastActivity: '2024-01-18T09:20:00Z',
  },
  {
    id: 'CP-004',
    name: 'Renewable Tech Kolkata',
    email: 'support@renewabletech.com',
    phone: '+91-6543210987',
    territory: 'East',
    status: 'active',
    totalLeads: 15,
    address: 'Kolkata, India',
    createdAt: '2024-01-08T00:00:00Z',
    lastActivity: '2024-01-17T14:10:00Z',
  },
  {
    id: 'CP-005',
    name: 'Sun Power Bangalore',
    email: 'hello@sunpower.com',
    phone: '+91-5432109876',
    territory: 'South',
    status: 'inactive',
    totalLeads: 8,
    address: 'Bangalore, India',
    createdAt: '2024-01-05T00:00:00Z',
    lastActivity: '2024-01-12T11:00:00Z',
  },
  {
    id: 'CP-006',
    name: 'Power Plus Pune',
    email: 'admin@powerplus.com',
    phone: '+91-4321098765',
    territory: 'West',
    status: 'pending',
    totalLeads: 0,
    address: 'Pune, India',
    createdAt: '2024-01-18T00:00:00Z',
    lastActivity: '2024-01-18T00:00:00Z',
  },
];

/**
 * Channel Partners hook
 */
export const useChannelPartners = (): UseChannelPartnersReturn => {
  const [channelPartners, setChannelPartners] = useState<ChannelPartner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load channel partners (simulated API call)
   */
  const loadChannelPartners = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // TODO: Replace with actual API call
      // const response = await fetch('/api/v1/channel-partners');
      // const data = await response.json();

      setChannelPartners(mockChannelPartners);
    } catch (err: any) {
      setError(err.message || 'Failed to load Channel Partners');
      console.error('Failed to load Channel Partners:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Initialize data on mount
   */
  useEffect(() => {
    loadChannelPartners();
  }, []);

  /**
   * Get active channel partners only
   */
  const activeChannelPartners = channelPartners.filter(
    cp => cp.status === 'active'
  );

  /**
   * Refresh channel partners
   */
  const refreshChannelPartners = () => {
    loadChannelPartners();
  };

  /**
   * Get channel partner by ID
   */
  const getChannelPartnerById = (id: string): ChannelPartner | undefined => {
    return channelPartners.find(cp => cp.id === id);
  };

  return {
    channelPartners,
    activeChannelPartners,
    isLoading,
    error,
    refreshChannelPartners,
    getChannelPartnerById,
  };
};

export default useChannelPartners;
