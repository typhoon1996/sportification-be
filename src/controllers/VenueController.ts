import { Request, Response } from 'express';
import { Venue } from '../models/Venue';
import {
  NotFoundError,
  ValidationError,
  ConflictError,
  sendSuccess,
  sendCreated,
  asyncHandler,
} from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { validatePagination, validateSort } from '../middleware/validation';

export class VenueController {
  // Create a new venue
  static createVenue = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
      name,
      description,
      location,
      surfaceType,
      capacity,
      amenities,
      operatingHours,
      contactInfo,
      pricing,
      images,
    } = req.body;

    const venue = new Venue({
      name: name.trim(),
      description: description?.trim(),
      location: {
        coordinates: [location.lng, location.lat], // GeoJSON format: [longitude, latitude]
        address: location.address.trim(),
        city: location.city.trim(),
        state: location.state?.trim(),
        country: location.country.trim(),
        zipCode: location.zipCode?.trim(),
      },
      surfaceType,
      capacity,
      amenities: amenities || [],
      operatingHours,
      contactInfo,
      pricing,
      images: images || [],
      createdBy: req.userId,
      rating: { average: 0, count: 0 },
      isPublic: req.body.isPublic !== false, // Default to public
      isActive: true,
    });

    await venue.save();
    await venue.populate('createdBy', 'profile');

    sendCreated(res, { venue }, 'Venue created successfully');
  });

  // Get all venues with filtering and pagination
  static getVenues = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip } = validatePagination(
      req.query.page as string,
      req.query.limit as string
    );
    const sort = validateSort(req.query.sort as string) || { 'rating.average': -1 };

    const filter: any = { isActive: true };

    // Apply filters
    if (req.query.isPublic !== undefined) {
      filter.isPublic = req.query.isPublic === 'true';
    }
    if (req.query.surfaceType) filter.surfaceType = req.query.surfaceType;
    if (req.query.city) filter['location.city'] = new RegExp(req.query.city as string, 'i');
    if (req.query.state) filter['location.state'] = new RegExp(req.query.state as string, 'i');
    if (req.query.country)
      filter['location.country'] = new RegExp(req.query.country as string, 'i');
    if (req.query.name) filter.name = new RegExp(req.query.name as string, 'i');

    // Capacity filter
    if (req.query.minCapacity)
      filter.capacity = { $gte: parseInt(req.query.minCapacity as string) };
    if (req.query.maxCapacity) {
      filter.capacity = filter.capacity || {};
      filter.capacity.$lte = parseInt(req.query.maxCapacity as string);
    }

    // Amenities filter
    if (req.query.amenities) {
      const amenities = (req.query.amenities as string).split(',');
      filter.amenities = { $in: amenities };
    }

    // Geospatial search (nearby venues)
    if (req.query.lat && req.query.lng) {
      const lat = parseFloat(req.query.lat as string);
      const lng = parseFloat(req.query.lng as string);
      const maxDistance = req.query.maxDistance
        ? parseFloat(req.query.maxDistance as string) * 1000
        : 10000; // Default 10km

      filter['location.coordinates'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat],
          },
          $maxDistance: maxDistance,
        },
      };
    }

    const [venues, total] = await Promise.all([
      Venue.find(filter).populate('createdBy', 'profile').sort(sort).skip(skip).limit(limit),
      Venue.countDocuments(filter),
    ]);

    // Add distance calculation if coordinates provided
    if (req.query.lat && req.query.lng) {
      const lat = parseFloat(req.query.lat as string);
      const lng = parseFloat(req.query.lng as string);

      venues.forEach((venue: any) => {
        venue._doc.distance = venue.distanceFrom(lat, lng);
      });
    }

    sendSuccess(res, {
      venues,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  });

  // Get venue by ID
  static getVenueById = asyncHandler(async (req: Request, res: Response) => {
    const venue = await Venue.findOne({
      _id: req.params.id,
      isActive: true,
    }).populate('createdBy', 'profile');

    if (!venue) {
      throw new NotFoundError('Venue');
    }

    // Add distance if coordinates provided
    if (req.query.lat && req.query.lng) {
      const lat = parseFloat(req.query.lat as string);
      const lng = parseFloat(req.query.lng as string);
      (venue as any)._doc.distance = venue.distanceFrom(lat, lng);
    }

    sendSuccess(res, { venue });
  });

  // Search venues by name or description
  static searchVenues = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip } = validatePagination(
      req.query.page as string,
      req.query.limit as string
    );
    const query = req.query.q as string;

    if (!query || query.trim().length < 2) {
      throw new ValidationError('Search query must be at least 2 characters long');
    }

    const searchFilter = {
      $and: [
        { isActive: true },
        { isPublic: true },
        {
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } },
            { 'location.address': { $regex: query, $options: 'i' } },
            { 'location.city': { $regex: query, $options: 'i' } },
          ],
        },
      ],
    };

    const [venues, total] = await Promise.all([
      Venue.find(searchFilter)
        .populate('createdBy', 'profile')
        .sort({ 'rating.average': -1 })
        .skip(skip)
        .limit(limit),
      Venue.countDocuments(searchFilter),
    ]);

    sendSuccess(res, {
      venues,
      query,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  });

  // Find nearby venues
  static findNearbyVenues = asyncHandler(async (req: Request, res: Response) => {
    const { lat, lng } = req.query;
    const maxDistance = req.query.maxDistance ? parseFloat(req.query.maxDistance as string) : 10;

    if (!lat || !lng) {
      throw new ValidationError('Latitude and longitude are required');
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);

    if (isNaN(latitude) || isNaN(longitude)) {
      throw new ValidationError('Invalid coordinates provided');
    }

    const venues = await (Venue as any).findNearby(latitude, longitude, maxDistance);

    // Add distance to each venue
    const venuesWithDistance = venues.map((venue: any) => {
      venue._doc.distance = venue.distanceFrom(latitude, longitude);
      return venue;
    });

    // Sort by distance
    venuesWithDistance.sort((a: any, b: any) => a._doc.distance - b._doc.distance);

    await Venue.populate(venuesWithDistance, { path: 'createdBy', select: 'profile' });

    sendSuccess(res, {
      venues: venuesWithDistance,
      searchCenter: { lat: latitude, lng: longitude },
      maxDistance,
    });
  });

  // Update venue
  static updateVenue = asyncHandler(async (req: AuthRequest, res: Response) => {
    const venue = await Venue.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!venue) {
      throw new NotFoundError('Venue');
    }

    // Only venue creator can update
    if (venue.createdBy.toString() !== req.userId) {
      throw new ConflictError('Only venue creator can update venue details');
    }

    const updates: any = {};
    const allowedUpdates = [
      'name',
      'description',
      'location',
      'surfaceType',
      'capacity',
      'amenities',
      'operatingHours',
      'contactInfo',
      'pricing',
      'images',
      'isPublic',
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === 'location' && req.body[field]) {
          // Handle location update with coordinate conversion
          updates[field] = {
            ...req.body[field],
            coordinates: [req.body[field].lng, req.body[field].lat],
          };
        } else {
          updates[field] = req.body[field];
        }
      }
    });

    Object.assign(venue, updates);
    await venue.save();

    await venue.populate('createdBy', 'profile');

    sendSuccess(res, { venue }, 'Venue updated successfully');
  });

  // Delete venue
  static deleteVenue = asyncHandler(async (req: AuthRequest, res: Response) => {
    const venue = await Venue.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!venue) {
      throw new NotFoundError('Venue');
    }

    // Only venue creator can delete
    if (venue.createdBy.toString() !== req.userId) {
      throw new ConflictError('Only venue creator can delete the venue');
    }

    // Soft delete
    venue.isActive = false;
    await venue.save();

    sendSuccess(res, null, 'Venue deleted successfully');
  });

  // Get venues by amenities
  static getVenuesByAmenities = asyncHandler(async (req: Request, res: Response) => {
    const { amenities } = req.query;

    if (!amenities) {
      throw new ValidationError('Amenities parameter is required');
    }

    const amenityList = (amenities as string).split(',');
    const venues = await (Venue as any).findByAmenities(amenityList);

    await Venue.populate(venues, { path: 'createdBy', select: 'profile' });

    sendSuccess(res, {
      venues,
      requestedAmenities: amenityList,
    });
  });

  // Check venue availability
  static checkAvailability = asyncHandler(async (req: Request, res: Response) => {
    const venue = await Venue.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!venue) {
      throw new NotFoundError('Venue');
    }

    const { date, time } = req.query;

    let checkDate: Date;
    if (date && time) {
      checkDate = new Date(`${date}T${time}`);
    } else {
      checkDate = new Date();
    }

    const isAvailable = venue.isAvailableAt(checkDate);
    const isCurrentlyOpen = (venue as any).isCurrentlyOpen;

    sendSuccess(res, {
      venue: {
        id: venue._id,
        name: venue.name,
      },
      availability: {
        isAvailable,
        isCurrentlyOpen,
        checkedAt: checkDate.toISOString(),
      },
    });
  });

  // Get user's venues
  static getUserVenues = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip } = validatePagination(
      req.query.page as string,
      req.query.limit as string
    );
    const userId = req.params.userId;

    const filter: any = {
      createdBy: userId,
      isActive: true,
    };

    if (req.query.isPublic !== undefined) {
      filter.isPublic = req.query.isPublic === 'true';
    }

    const [venues, total] = await Promise.all([
      Venue.find(filter)
        .populate('createdBy', 'profile')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Venue.countDocuments(filter),
    ]);

    sendSuccess(res, {
      venues,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  });
}
