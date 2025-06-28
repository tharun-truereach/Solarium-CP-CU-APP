/**
 * Mock API data and handlers for leads
 * Provides sample data for testing lead functionality
 */

import { rest } from 'msw';
import type {
  Lead,
  LeadTimelineItem,
  LeadListResponse,
  LeadTimelineResponse,
} from '../types/lead.types';

/**
 * Sample lead data
 */
export const mockLeads: Lead[] = [
  {
    id: '1',
    leadId: 'LEAD-001',
    customerName: 'Rajesh Kumar',
    customerPhone: '+919876543210',
    customerEmail: 'rajesh.kumar@example.com',
    address: '123 MG Road, Pune, Maharashtra',
    state: 'Maharashtra',
    pinCode: '411001',
    territory: 'West',
    status: 'New Lead',
    origin: 'CP',
    assignedTo: 'cp-1',
    assignedCpName: 'Amit Sharma',
    createdBy: 'cp-1',
    createdByName: 'Amit Sharma',
    followUpDate: '2024-02-01',
    remarks: 'Customer interested in 5kW solar installation',
    services: ['Solar Panel Installation'],
    requirements: '5kW residential solar system',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    documentCount: 3,
    quotationCount: 1,
    hasActiveQuotation: true,
  },
  {
    id: '2',
    leadId: 'LEAD-002',
    customerName: 'Priya Patel',
    customerPhone: '+919876543211',
    customerEmail: 'priya.patel@example.com',
    address: '456 Commercial Street, Mumbai, Maharashtra',
    state: 'Maharashtra',
    pinCode: '400001',
    territory: 'West',
    status: 'In Discussion',
    origin: 'Customer',
    assignedTo: 'cp-2',
    assignedCpName: 'Neha Singh',
    createdBy: 'customer-1',
    createdByName: 'Priya Patel',
    followUpDate: '2024-01-30',
    remarks: 'Follow-up call scheduled, customer comparing options',
    services: ['Solar Panel Installation', 'Solar Water Heater'],
    requirements: '3kW residential solar + water heater',
    createdAt: '2024-01-12T14:30:00Z',
    updatedAt: '2024-01-20T09:15:00Z',
    documentCount: 2,
    quotationCount: 2,
    hasActiveQuotation: true,
  },
  {
    id: '3',
    leadId: 'LEAD-003',
    customerName: 'Vikram Singh',
    customerPhone: '+919876543212',
    customerEmail: 'vikram.singh@example.com',
    address: '789 Sector 15, Gurgaon, Haryana',
    state: 'Haryana',
    pinCode: '122001',
    territory: 'North',
    status: 'Physical Meeting Assigned',
    origin: 'CP',
    assignedTo: 'cp-3',
    assignedCpName: 'Rohit Verma',
    createdBy: 'cp-3',
    createdByName: 'Rohit Verma',
    followUpDate: '2024-01-28',
    remarks: 'Site survey scheduled for next week',
    services: ['Solar Panel Installation'],
    requirements: '10kW commercial solar system',
    createdAt: '2024-01-10T11:20:00Z',
    updatedAt: '2024-01-22T16:45:00Z',
    documentCount: 5,
    quotationCount: 1,
    hasActiveQuotation: false,
  },
  {
    id: '4',
    leadId: 'LEAD-004',
    customerName: 'Anita Desai',
    customerPhone: '+919876543213',
    customerEmail: 'anita.desai@example.com',
    address: '321 Park Avenue, Bangalore, Karnataka',
    state: 'Karnataka',
    pinCode: '560001',
    territory: 'South',
    status: 'Customer Accepted',
    origin: 'Admin',
    assignedTo: 'cp-4',
    assignedCpName: 'Suresh Kumar',
    createdBy: 'admin-1',
    createdByName: 'System Admin',
    quotationRef: 'QUOTE-004',
    remarks: 'Customer accepted quotation, ready to proceed',
    services: ['Solar Panel Installation', 'Battery Storage'],
    requirements: '7kW residential solar with battery backup',
    createdAt: '2024-01-08T13:15:00Z',
    updatedAt: '2024-01-25T10:30:00Z',
    documentCount: 4,
    quotationCount: 3,
    hasActiveQuotation: true,
  },
  {
    id: '5',
    leadId: 'LEAD-005',
    customerName: 'Mohammed Ali',
    customerPhone: '+919876543214',
    customerEmail: 'mohammed.ali@example.com',
    address: '654 Industrial Area, Chennai, Tamil Nadu',
    state: 'Tamil Nadu',
    pinCode: '600001',
    territory: 'South',
    status: 'Won',
    origin: 'KAM',
    assignedTo: 'cp-5',
    assignedCpName: 'Kavitha Raj',
    createdBy: 'kam-1',
    createdByName: 'Ramesh KAM',
    quotationRef: 'QUOTE-005',
    remarks: 'Deal closed, moving to execution phase',
    services: ['Solar Panel Installation'],
    requirements: '15kW industrial solar system',
    createdAt: '2024-01-05T09:45:00Z',
    updatedAt: '2024-01-26T14:20:00Z',
    documentCount: 7,
    quotationCount: 2,
    hasActiveQuotation: true,
  },
  {
    id: '6',
    leadId: 'LEAD-006',
    customerName: 'Sunita Gupta',
    customerPhone: '+919876543215',
    customerEmail: 'sunita.gupta@example.com',
    address: '987 Civil Lines, Delhi',
    state: 'Delhi',
    pinCode: '110001',
    territory: 'North',
    status: 'Under Execution',
    origin: 'CP',
    assignedTo: 'cp-6',
    assignedCpName: 'Manish Agarwal',
    createdBy: 'cp-6',
    createdByName: 'Manish Agarwal',
    quotationRef: 'QUOTE-006',
    tokenNumber: 'TOKEN-006',
    remarks: 'Installation in progress, 70% complete',
    services: ['Solar Panel Installation', 'Net Metering'],
    requirements: '4kW residential solar with net metering',
    createdAt: '2024-01-01T08:00:00Z',
    updatedAt: '2024-01-27T11:10:00Z',
    documentCount: 6,
    quotationCount: 1,
    hasActiveQuotation: false,
  },
  {
    id: '7',
    leadId: 'LEAD-007',
    customerName: 'Deepak Joshi',
    customerPhone: '+919876543216',
    customerEmail: 'deepak.joshi@example.com',
    address: '147 Lake View, Udaipur, Rajasthan',
    state: 'Rajasthan',
    pinCode: '313001',
    territory: 'West',
    status: 'Executed',
    origin: 'CP',
    assignedTo: 'cp-7',
    assignedCpName: 'Ravi Gupta',
    createdBy: 'cp-7',
    createdByName: 'Ravi Gupta',
    quotationRef: 'QUOTE-007',
    tokenNumber: 'TOKEN-007',
    remarks: 'Project completed successfully, customer satisfied',
    services: ['Solar Panel Installation', 'Solar Water Heater'],
    requirements: '6kW residential solar + water heater',
    createdAt: '2023-12-15T12:30:00Z',
    updatedAt: '2024-01-20T15:45:00Z',
    documentCount: 5,
    quotationCount: 1,
    hasActiveQuotation: false,
  },
  {
    id: '8',
    leadId: 'LEAD-008',
    customerName: 'Rekha Sharma',
    customerPhone: '+919876543217',
    customerEmail: 'rekha.sharma@example.com',
    address: '258 Green Colony, Jaipur, Rajasthan',
    state: 'Rajasthan',
    pinCode: '302001',
    territory: 'West',
    status: 'Not Responding',
    origin: 'Customer',
    assignedTo: 'cp-8',
    assignedCpName: 'Pooja Mehta',
    createdBy: 'customer-2',
    createdByName: 'Rekha Sharma',
    remarks: 'Multiple follow-up attempts failed, customer not responding',
    services: ['Solar Panel Installation'],
    requirements: '2kW residential solar system',
    createdAt: '2024-01-03T16:20:00Z',
    updatedAt: '2024-01-18T09:30:00Z',
    documentCount: 1,
    quotationCount: 0,
    hasActiveQuotation: false,
  },
];

/**
 * Sample timeline data
 */
export const mockTimeline: LeadTimelineItem[] = [
  // LEAD-001 Timeline
  {
    id: 'timeline-1',
    leadId: '1',
    action: 'Lead Created',
    actor: 'cp-1',
    actorName: 'Amit Sharma',
    timestamp: '2024-01-15T10:00:00Z',
    details: {
      field: 'status',
      newValue: 'New Lead',
      reason: 'Initial lead creation from customer inquiry',
      source: 'Channel Partner App',
      customerInfo: {
        name: 'Rajesh Kumar',
        phone: '+919876543210',
        location: 'Pune, Maharashtra',
      },
    },
  },
  {
    id: 'timeline-2',
    leadId: '1',
    action: 'Lead Updated',
    actor: 'cp-1',
    actorName: 'Amit Sharma',
    timestamp: '2024-01-15T14:30:00Z',
    details: {
      field: 'requirements',
      oldValue: '5kW solar system',
      newValue: '5kW residential solar system',
      reason:
        'Customer clarified installation location and requirements after initial call',
      additionalNotes:
        'Customer mentioned south-facing rooftop with minimal shading',
    },
  },
  {
    id: 'timeline-3',
    leadId: '1',
    action: 'Document Uploaded',
    actor: 'cp-1',
    actorName: 'Amit Sharma',
    timestamp: '2024-01-16T09:15:00Z',
    details: {
      documentType: 'Site Photo',
      fileName: 'rooftop_photo.jpg',
      fileSize: '2.4 MB',
      reason:
        'Site assessment documentation for technical feasibility analysis',
    },
  },
  {
    id: 'timeline-4',
    leadId: '1',
    action: 'Status Changed',
    actor: 'cp-1',
    actorName: 'Amit Sharma',
    timestamp: '2024-01-18T11:45:00Z',
    details: {
      field: 'status',
      oldValue: 'New Lead',
      newValue: 'In Discussion',
      reason: 'Customer showed interest after initial proposal discussion',
      followUpDate: '2024-02-01',
      additionalInfo: {
        discussionTopics: [
          'System sizing',
          'ROI calculation',
          'Installation timeline',
        ],
        customerConcerns: ['Initial investment', 'Maintenance requirements'],
      },
    },
  },
  {
    id: 'timeline-5',
    leadId: '1',
    action: 'Quotation Generated',
    actor: 'cp-1',
    actorName: 'Amit Sharma',
    timestamp: '2024-01-20T16:20:00Z',
    details: {
      quotationId: 'QUOTE-001',
      systemSize: '5kW',
      totalAmount: 350000,
      subsidyAmount: 70000,
      finalAmount: 280000,
      reason:
        'Initial quotation based on customer requirements and site assessment',
      validityDays: 30,
    },
  },

  // LEAD-002 Timeline
  {
    id: 'timeline-6',
    leadId: '2',
    action: 'Lead Created',
    actor: 'customer-1',
    actorName: 'Priya Patel',
    timestamp: '2024-01-12T14:30:00Z',
    details: {
      field: 'status',
      newValue: 'New Lead',
      source: 'Customer Self-Registration',
      origin: 'Customer Mobile App',
      services: ['Solar Panel Installation', 'Solar Water Heater'],
    },
  },
  {
    id: 'timeline-7',
    leadId: '2',
    action: 'Lead Reassigned',
    actor: 'admin-1',
    actorName: 'System Admin',
    timestamp: '2024-01-13T09:00:00Z',
    details: {
      field: 'assignedTo',
      oldValue: 'Unassigned',
      newValue: 'cp-2 (Neha Singh)',
      reason: 'Assigned to CP in Mumbai territory based on customer location',
      territory: 'West',
      previousTerritory: null,
    },
  },
  {
    id: 'timeline-8',
    leadId: '2',
    action: 'Status Changed',
    actor: 'cp-2',
    actorName: 'Neha Singh',
    timestamp: '2024-01-15T10:30:00Z',
    details: {
      field: 'status',
      oldValue: 'New Lead',
      newValue: 'In Discussion',
      reason: 'Customer called back, discussed requirements in detail',
      followUpDate: '2024-01-30',
      callDuration: '25 minutes',
      keyPoints: [
        '3kW system preferred',
        'Budget conscious',
        'Interested in water heater combo',
      ],
    },
  },

  // LEAD-003 Timeline
  {
    id: 'timeline-9',
    leadId: '3',
    action: 'Lead Created',
    actor: 'cp-3',
    actorName: 'Rohit Verma',
    timestamp: '2024-01-10T11:20:00Z',
    details: {
      field: 'status',
      newValue: 'New Lead',
      source: 'Channel Partner App',
      leadSource: 'Referral',
      referredBy: 'Existing Customer - Mr. Sharma',
    },
  },
  {
    id: 'timeline-10',
    leadId: '3',
    action: 'Status Changed',
    actor: 'cp-3',
    actorName: 'Rohit Verma',
    timestamp: '2024-01-15T14:15:00Z',
    details: {
      field: 'status',
      oldValue: 'New Lead',
      newValue: 'Physical Meeting Assigned',
      reason:
        'Customer requested on-site visit for commercial installation assessment',
      followUpDate: '2024-01-28',
      meetingScheduled: '2024-01-25T10:00:00Z',
      meetingLocation: 'Customer Office - Sector 15, Gurgaon',
    },
  },
];

/**
 * Mock API handlers for leads
 */
export const leadMockHandlers = [
  // Get leads list
  rest.get('*/api/v1/leads', (req, res, ctx) => {
    const url = req.url;
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const limit = parseInt(url.searchParams.get('limit') || '25');
    const status = url.searchParams.get('status');
    const territory = url.searchParams.get('territory');
    const search = url.searchParams.get('search');
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';

    console.log('🔍 Mock API: GET /api/v1/leads', {
      offset,
      limit,
      status,
      territory,
      search,
      sortBy,
      sortOrder,
    });

    let filteredLeads = [...mockLeads];

    // Apply filters
    if (status) {
      filteredLeads = filteredLeads.filter(lead => lead.status === status);
    }

    if (territory) {
      filteredLeads = filteredLeads.filter(
        lead => lead.territory === territory
      );
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredLeads = filteredLeads.filter(
        lead =>
          lead.customerName.toLowerCase().includes(searchLower) ||
          lead.customerPhone.includes(search) ||
          lead.leadId.toLowerCase().includes(searchLower) ||
          (lead.customerEmail &&
            lead.customerEmail.toLowerCase().includes(searchLower))
      );
    }

    // Apply sorting
    filteredLeads.sort((a, b) => {
      let aValue = a[sortBy as keyof Lead] as string;
      let bValue = b[sortBy as keyof Lead] as string;

      if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
        aValue = new Date(aValue).getTime().toString();
        bValue = new Date(bValue).getTime().toString();
      }

      if (sortOrder === 'desc') {
        return bValue.localeCompare(aValue);
      } else {
        return aValue.localeCompare(bValue);
      }
    });

    // Apply pagination
    const total = filteredLeads.length;
    const paginatedLeads = filteredLeads.slice(offset, offset + limit);
    const totalPages = Math.ceil(total / limit);

    const response: LeadListResponse = {
      success: true,
      data: {
        items: paginatedLeads,
        total,
        offset,
        limit,
        totalPages,
      },
    };

    return res(ctx.json(response));
  }),

  // Update lead status
  rest.patch('*/api/v1/leads/:leadId/status', (req, res, ctx) => {
    const { leadId } = req.params;

    console.log('🔄 Mock API: PATCH /api/v1/leads/:leadId/status', { leadId });

    // Find the lead
    const leadIndex = mockLeads.findIndex(lead => lead.id === leadId);
    if (leadIndex === -1) {
      return res(ctx.status(404), ctx.json({ message: 'Lead not found' }));
    }

    // Update the lead (in a real app, this would validate the status transition)
    const updatedLead = {
      ...mockLeads[leadIndex],
      updatedAt: new Date().toISOString(),
    };

    // Simulate server delay
    return res(
      ctx.delay(500),
      ctx.json({
        success: true,
        data: updatedLead,
      })
    );
  }),

  // Get lead timeline
  rest.get('*/api/v1/leads/:leadId/timeline', (req, res, ctx) => {
    const { leadId } = req.params;
    const limit = parseInt(req.url.searchParams.get('limit') || '50');

    console.log('📋 Mock API: GET /api/v1/leads/:leadId/timeline', {
      leadId,
      limit,
    });

    // Filter timeline for this lead
    const leadTimeline = mockTimeline
      .filter(item => item.leadId === leadId)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ) // Most recent first
      .slice(0, limit);

    const response: LeadTimelineResponse = {
      success: true,
      data: {
        timeline: leadTimeline,
        total: mockTimeline.filter(item => item.leadId === leadId).length,
        leadId: leadId as string,
      },
    };

    // Simulate network delay
    return res(ctx.delay(300), ctx.json(response));
  }),

  // Create lead
  rest.post('*/api/v1/leads', (req, res, ctx) => {
    console.log('➕ Mock API: POST /api/v1/leads');

    const newLead: Lead = {
      id: `${mockLeads.length + 1}`,
      leadId: `LEAD-${String(mockLeads.length + 1).padStart(3, '0')}`,
      customerName: 'New Customer',
      customerPhone: '+919876540000',
      address: 'New Address',
      state: 'Maharashtra',
      pinCode: '400001',
      territory: 'West',
      status: 'New Lead',
      origin: 'CP',
      assignedTo: 'cp-1',
      assignedCpName: 'Current User',
      createdBy: 'cp-1',
      createdByName: 'Current User',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      documentCount: 0,
      quotationCount: 0,
    };

    mockLeads.push(newLead);

    return res(
      ctx.delay(300),
      ctx.json({
        success: true,
        data: newLead,
      })
    );
  }),

  // Debug catch-all handler
  rest.all('*/api/v1/*', (req, res, ctx) => {
    console.log('🔍 MSW Debug: Unhandled request', {
      method: req.method,
      url: req.url.href,
      pathname: req.url.pathname,
      search: req.url.search,
    });

    return res(
      ctx.status(404),
      ctx.json({
        message: `Unhandled request: ${req.method} ${req.url.pathname}`,
        availableEndpoints: [
          'GET */api/v1/leads',
          'POST */api/v1/leads',
          'PATCH */api/v1/leads/:leadId/status',
          'GET */api/v1/leads/:leadId/timeline',
        ],
      })
    );
  }),
];
