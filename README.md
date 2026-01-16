# Resona   The Superfan Commerce OS (Micro Fulfillment Network MVP)

## Overview
A commerce platform connecting artists, buyers, and fulfillment hubs for merchandise distribution. The system manages product listings, order processing, fulfillment assignments, payment splitting, and tour/event management across multiple stakeholders with integrated blockchain authenticity features.

## User Roles
- **Artist**: Creates and manages products (physical, NFT, phygital), views sales analytics, tracks product orders, manages inventory across fulfillment hubs, manages tours and exclusive drops
- **Buyer**: Browses products, places orders, tracks shipments, verifies product authenticity
- **Hub**: Manages assigned orders, updates fulfillment status, accesses comprehensive dashboard with navigation for job queue, settlements, analytics, inventory, shipping, reports, and settings
- **Admin**: Platform oversight, analytics, system management, comprehensive hub management including viewing all hub applications (pending, approved, rejected, suspended), approving/rejecting new applications, and managing existing hub statuses

## Core Features

### Product Management
- Artists can create, update, and delete their products with support for three product types: Physical Merch, NFT, and Phygital (both physical and digital)
- Unified product creation modal with step-by-step form:
  - Step 1: Basic information (Product Name, Description, Product Type selector, Price in USD/ICP, Inventory for physical items)
  - Step 2: Type-specific fields based on selection:
    - **Physical Merch**: Product images, SKU/Edition ID, shipping details (weight, location), optional "Mint NFT Certificate of Authenticity" toggle
    - **NFT**: File upload (image, video, audio, 3D), blockchain selection (ICP, Ethereum, Solana), royalty percentage, unlockable content (optional), supply (1 of 1 or limited edition)
    - **Phygital**: Combined physical and NFT fields, plus optional "Attach NFC/QR tag" field
- Image upload functionality for product creation with preview capability
- Backend blob storage system for uploaded product images and NFT files
- **Robust image handling**: Product images are properly handled as ExternalBlob types with correct URL generation and display throughout all product components
- **Type-safe image display**: ProductCard and related components include comprehensive type checking and error handling for product images to prevent runtime errors
- **Safe image URL handling**: Image URLs are generated safely without attempting to call getDirectURL as a function, with proper fallback handling for missing or invalid images
- Authenticity features with toggles for minting blockchain certificates and public verification links
- **Post-creation navigation**: After successful product creation, the application automatically navigates to the Inventory tab and displays the newly created product with all its details
- **Robust post-creation flow**: Comprehensive error handling during product creation completion to prevent blank pages or navigation failures
- **Guaranteed inventory display**: The Inventory tab always loads correctly after product creation, showing the new product information with proper loading states and error recovery

### Blockchain Certificate System
- Automatic minting of unique certificate NFTs on ICP for each product (physical, digital, or phygital)
- Certificate storage includes: product name, artist ID, metadata hash, timestamp, and version
- Auto-generation of unique QR/NFC tags for physical merchandise linking to on-chain certificates
- Public verification API endpoint (GET /api/verify/:product_id) returning product authenticity and NFT details
- Verifiable public links for embedding in external sites

### Order Processing
- Buyers can place orders for products across all product types
- Order status lifecycle: pending → assigned → processing → shipped → delivered
- Automatic order assignment to nearest fulfillment hub based on location and capacity
- Auto-update stuck orders after 72 hours
- Certificate delivery for NFT and phygital products

### Artist Order Tracking
- Enhanced "Product Orders" tab in artist dashboard displaying detailed, filterable order list with comprehensive error handling
- Order filtering by status, date range (default "Last 30 days"), and hub ("All Hubs" option)
- Search functionality for Order ID, customer name, or email
- Order Summary section showing total orders, count by status, and urgent/pending indicators
- Each order row displays: Order ID, status badge, customer name and email, order date, price, hub name, total price, and item count
- Order detail view accessible via side panel or modal when selecting an order
- Located within or below the "Manage your products and track your sales" area
- **Robust error handling with guaranteed UI display**: Never shows blank page, always renders order tracking interface
- **Comprehensive fallback states**: Loading indicators during data fetch, error messages with retry options when data fails to load, and helpful empty state messaging when no orders exist
- **Reliable data fetching**: Proper API error handling with retry mechanisms and graceful degradation
- **User-friendly error messages**: Clear, actionable error messages in English with guidance for resolution
- **Consistent interface rendering**: OrdersTab component always displays the order tracking interface structure regardless of data state
- **BigInt serialization safety**: All numeric data from backend is properly converted to strings or numbers before serialization, preventing BigInt serialization errors and ensuring safe data handling in React Query and UI components

### Artist Inventory Management
- "Inventory" tab in artist dashboard displaying streamlined inventory management interface
- Main inventory table listing all products (physical and phygital types only) with columns: Product Name, Hub Location, Stock, Pending, Status (with visual icons for low stock/in stock), Last Updated, and Actions
- Hub assignment functionality allowing artists to assign or choose which hubs each product is available at directly from the inventory table via dropdown or assign button in the Actions column
- Artists can only assign products to approved hubs that are visible in the system
- Visual consistency with existing dashboard styling and navigation
- Real-time inventory updates and status tracking across all fulfillment hubs
- **Post-creation product display**: Automatically displays newly created products with complete details and proper formatting
- **Enhanced error handling**: Comprehensive error handling and loading states to prevent blank pages during navigation or data fetching
- **Guaranteed tab loading**: The Inventory tab always loads correctly with proper fallback states and error recovery mechanisms
- **Reliable data refresh**: Automatic data refresh after product creation to ensure the new product appears immediately with all relevant information
- **Safe product image rendering**: All product images in inventory displays are handled with proper type checking and error boundaries to prevent crashes
- **Intuitive hub assignment**: Error-free hub assignment interface with clear feedback and validation

### Tour Management
- "Tour Management" tab in artist dashboard for managing tours and exclusive drops
- Summary section displaying: number of tours, upcoming shows count, ticket sales percentage and numbers, total merch revenue, average merch per show
- Tour list with filtering options: "All," "Upcoming," and "Completed" tours
- Each tour displays: venue name, type (e.g., Exclusive Drop), status, location, date, ticket sales (number and percentage), merch revenue, and "View Exclusive Drop" action
- Quick action button to "Add Tour Date"
- Visual consistency with existing dashboard styling and navigation

### Fulfillment Network
- Hub assignment using distance calculation and capacity checks
- Artist-controlled hub assignment for products through inventory management interface, limited to approved hubs only
- Hubs receive assigned orders and manage fulfillment workflow
- Real-time order status updates from hubs to buyers
- Inventory tracking and management across multiple fulfillment hubs
- Support for NFT and phygital order fulfillment

### Hub Dashboard & Navigation
- Comprehensive hub dashboard with full navigation sidebar including:
  - **Dashboard**: Overview metrics, key performance indicators, recent activity summary
  - **Job Queue**: Manage incoming orders and fulfillment tasks with status updates
  - **Settlements**: Earnings tracking, payout history, and financial summaries
  - **Analytics**: Performance metrics, fulfillment statistics, and trend analysis
  - **Inventory**: Stock management, product availability, and inventory levels
  - **Shipping**: Logistics tracking, shipment management, and delivery updates
  - **Reports**: Generate and download performance, financial, and operational reports
  - **Settings**: Hub configuration, profile management, and operational preferences with functional save/update capabilities
- Role-appropriate navigation and access controls for hub users
- Dashboard overview displaying key metrics: pending orders, completed shipments, revenue, inventory alerts
- Clear visual hierarchy and intuitive navigation structure

### Hub Settings Management
- **Reliable Hub Data Loading**: Hub Settings tab automatically loads the correct hub information for the authenticated hub user without "Hub not found" errors
- **Robust Hub Identification**: Backend properly identifies and retrieves hub data based on authenticated user session with comprehensive error handling and fallback mechanisms
- **Functional Settings Form**: Complete settings form allowing hubs to modify their profile information, operational preferences, and business details with guaranteed data persistence
- **Working Save/Update Operations**: "Save" and "Update" buttons that reliably update hub information including Hub Name and Operational Settings with proper validation and confirmation
- **Enhanced Error Handling**: Comprehensive error handling for all settings operations with specific, user-friendly error messages in English and retry options
- **Success Feedback**: Clear success messages and visual confirmation when settings are successfully saved or updated
- **Apply for Approval Functionality**: Fully functional "Apply for Approval" button that submits the hub application for admin review and properly updates the hub's status to "pending"
- **Application Status Tracking**: Real-time visual indication of current application status (draft, pending, approved, rejected) within the settings interface
- **Form Validation**: Complete form validation ensuring all required fields are completed before allowing save or application submission
- **Loading States**: Proper loading indicators during save operations and status updates to provide clear user feedback
- **Data Consistency**: Ensures hub settings data remains consistent across all dashboard sections after updates

### Hub Registration & Approval System
- Self-service hub sign-up flow allowing any user to apply to create a new fulfillment hub
- Hub application form collecting: business information, location details, capacity, services offered, contact information
- **Seamless Application Workflow**: Hubs can reliably apply for approval directly from their Settings tab, with applications immediately appearing in admin's pending list without delays or errors
- **Guaranteed Admin Visibility**: All hub applications, including newly submitted ones, are immediately and consistently visible to admins for review and action
- **Comprehensive Admin Hub Management**: Unified admin interface displaying all hub applications and existing hubs with reliable filtering by status (pending, approved, rejected, suspended)
- **Robust Hub Status Management**: Admin interface for approving, rejecting, or suspending hubs with guaranteed status change tracking and immediate visibility updates
- **Real-time Status Synchronization**: Hub status changes are reflected immediately across the platform for all user roles without refresh requirements
- **Approved Hub Visibility**: Once approved by admin, hubs become immediately visible to artists for product assignment and to buyers for discovery
- **Error-free Application Processing**: Comprehensive error handling throughout the application and approval workflow to prevent lost applications or status update failures
- Notification system for hub approval status updates

### Admin Hub Management Dashboard
- **Always-Visible Pending Applications**: Admin dashboard reliably displays all pending hub applications without missing entries or loading failures
- **Comprehensive Hub Overview**: Complete management interface showing all hub applications and existing hubs in a single, consistently loaded view
- **Reliable Application Queue**: Pending applications are always visible with complete application details, submission dates, and functional action buttons for approval/rejection
- **Guaranteed Status Management**: Admin actions for approving, rejecting, or suspending hubs work reliably with immediate status updates and proper error handling
- **Enhanced Error Handling**: Comprehensive error handling for all admin operations with specific, actionable error messages in English and retry mechanisms
- **Real-time Updates**: Immediate reflection of all admin actions across the platform without requiring page refreshes or manual updates
- **Robust Data Loading**: Admin hub management interface loads reliably with proper fallback states and error recovery to prevent blank pages
- **Complete Hub Information**: Full application details display including business information, location, capacity, services, and contact information
- **Bulk Operations**: Ability to approve/reject multiple applications or change status of multiple hubs simultaneously with proper error handling
- **Search and Filtering**: Reliable search and filtering functionality for hubs by name, location, status, or application date
- **Audit Trail**: Complete logging of all admin actions with timestamps and reasoning for accountability
- **User Feedback**: Clear success and error messages for all admin operations with specific guidance for resolution

### Payment System
- Automatic payment splitting: Artist (70%), Hub (20%), Platform (10%)
- Payment records stored for all transactions
- Integration ready for payment processors
- Support for USD and ICP pricing

### Authentication & Authorization
- JWT-based authentication for all user roles
- Role-based access control for different endpoints
- Secure admin panel access with comprehensive hub management permissions
- Hub-specific authentication and dashboard access

### Analytics & Reporting
- Admin dashboard with platform-wide metrics including hub application statistics and approval rates
- Artist sales analytics and performance data including dashboard summary metrics
- Hub fulfillment statistics and performance tracking
- Hub-specific analytics and reporting capabilities

### Artist Dashboard Summary
- Comprehensive dashboard summary section displaying key metrics and quick actions
- Total sales with percentage change and monetary value
- Active fans count with growth indicators
- Pending orders with urgent count highlighting and total count
- Monthly revenue with growth percentage
- Quick action buttons for common tasks (Create New Product, View Orders, Analytics Dashboard, Settings)
- Recent activity feed showing latest events (new orders, low stock alerts, shipments)
- Quick stats overview including products published, average order value, customer satisfaction, and fulfillment time
- Performance metrics including plays, revenue, top tracks
- Action items highlighting urgent tasks requiring attention
- Platform announcements and updates

### Product Authenticity & Verification
- Certificate generation with serial numbers and QR codes for fulfilled items
- Certificate verification endpoint for authenticity checks
- Public verification links for product authenticity
- Blockchain-based certificate minting and storage
- NFC/QR tag integration for physical products

## Data Storage
The backend stores:
- User accounts and authentication data
- Product catalog with inventory levels, product types (physical, NFT, phygital), and image blob references with proper ExternalBlob type handling
- Product-hub assignment relationships and availability mapping (limited to approved hubs)
- NFT metadata, blockchain information, and certificate data
- Order records and status history with customer information
- **Reliable Hub Data Storage**: Comprehensive hub information including application details, approval status, capacity, business information, and status change history with proper user-hub relationship mapping
- **Hub Settings Persistence**: Hub profile information, operational preferences, and business details with guaranteed update tracking and data consistency
- **Application Workflow Data**: Complete application records with submission timestamps, admin review notes, and approval workflow data with proper status tracking
- **Hub Status Management**: Real-time hub status tracking with automatic visibility updates across artist and buyer interfaces and guaranteed data consistency
- **Admin Action Logging**: Complete audit trail of all admin actions on hub applications and status changes with timestamps, reasoning, and user identification
- Payment transaction records
- Uploaded product images and NFT files via blob storage system with safe URL generation
- Generated certificates and blockchain certificate NFTs
- Artist analytics data including sales metrics, fan engagement, and performance statistics
- Activity logs for dashboard recent activity feed
- Customer satisfaction ratings and fulfillment time tracking
- Order filtering and search metadata for enhanced artist order tracking
- Inventory data by fulfillment hub including stock levels, pending quantities, and low stock thresholds
- Hub activity logs for inventory management and recent activity tracking
- Product-hub inventory relationships and stock movement history
- Tour and event data including venue information, dates, ticket sales, merchandise revenue, and exclusive drop details
- Tour status tracking and performance metrics
- Blockchain certificate records and verification data
- QR/NFC tag associations and authenticity records
- **Product creation completion status**: Tracking of successful product creation events for proper post-creation navigation and inventory updates
- **Hub settings update history**: Complete tracking of all hub settings modifications with timestamps and change details for audit purposes

## API Structure
RESTful JSON endpoints organized by modules:
- `/api/artists` - Artist management, products (all types), order tracking, inventory management, and tour management (including image upload with proper ExternalBlob handling)
- `/api/buyers` - Buyer operations and orders
- `/api/hubs` - Fulfillment hub operations, inventory updates, dashboard data, job queue management, settlements, analytics, shipping, and reports
- **`/api/hubs/settings`** - Reliable hub settings management endpoints with guaranteed hub data retrieval, proper validation, error handling, and successful save/update operations
- **`/api/hubs/apply`** - Robust hub application submission endpoint for applying for approval from settings interface with proper status updates and admin notification
- **`/api/admin/hubs`** - Comprehensive and reliable hub management endpoints including guaranteed visibility of all applications, functional approval/rejection operations, status management, and bulk operations with proper error handling
- `/api/admin` - Platform administration and general admin functions
- `/api/orders` - Order processing, tracking, and detailed retrieval with enhanced error handling and fallback responses
- `/api/payments` - Payment and transaction data
- `/api/analytics` - Dashboard summary metrics and statistics
- `/api/inventory` - Inventory management, stock levels, hub-specific inventory data, and product-hub assignment operations with enhanced post-creation product retrieval
- `/api/tours` - Tour and event management, ticket sales tracking, and exclusive drop data
- `/api/verify/:product_id` - Product authenticity verification endpoint
- `/api/certificates` - Blockchain certificate management and minting
- `/api/nft` - NFT creation, metadata, and blockchain operations
- **Enhanced hub identification endpoints**: Improved hub data retrieval based on authenticated user sessions with comprehensive error handling and proper user-hub relationship validation
- **Reliable application processing endpoints**: API endpoints that guarantee proper application submission, status updates, and admin visibility without data loss or processing failures
- **Robust admin management endpoints**: Complete API suite for admin hub management with guaranteed data consistency, real-time updates, and comprehensive error handling for all operations

## Technical Requirements
- Express.js web framework
- PostgreSQL database with Prisma ORM
- Blob storage system for image and NFT file management with proper ExternalBlob type support
- Blockchain integration for ICP certificate minting
- Multi-blockchain support (ICP, Ethereum, Solana) for NFT creation
- QR/NFC tag generation and management system
- Automated database migrations and seeding
- API documentation generation
- Environment-based configuration
- Ready for cloud deployment
- **Guaranteed Hub Data Integrity**: Robust database queries and user-hub relationship validation to ensure hub settings always load the correct hub information without "Hub not found" errors
- **Reliable Application Processing**: Comprehensive error handling and data validation throughout the hub application and approval workflow to prevent lost applications or failed status updates
- **Real-time Status Synchronization**: Automatic synchronization mechanisms to ensure hub status changes are immediately reflected across all user interfaces and database relationships
- **Enhanced Error Recovery**: Comprehensive error handling and logging for all hub-related operations with guaranteed fallback responses and user-friendly error messages in English
- **Robust API Responses**: Proper HTTP status codes and structured error responses that prevent blank page rendering and provide actionable feedback to users
- **Data Consistency Validation**: Database constraints and validation rules to ensure hub data integrity and prevent inconsistent states during updates and status changes
- **Session-based Hub Identification**: Reliable user session management and hub identification to ensure authenticated hub users can always access their correct hub data
- **Admin Interface Reliability**: Comprehensive error handling and real-time updates for admin hub management interface to ensure all applications and status changes are immediately visible and actionable
- **Graceful Degradation**: All hub-related API endpoints designed to always return usable data structures even during failures, with proper loading states and error recovery mechanisms
- **BigInt conversion handling**: Backend API responses must convert all BigInt values (from Motoko Nat/Int types) to strings or numbers before JSON serialization to prevent frontend serialization errors
- **Data type safety**: Utility functions for recursive BigInt conversion in API response processing to ensure compatibility with React Query and frontend components
- **Serialization-safe data flow**: All numeric data from backend to frontend is properly formatted to prevent "Do not know how to serialize a BigInt" errors
- **Post-creation navigation reliability**: Robust navigation handling after product creation with proper error boundaries and loading state management
- **Inventory tab stability**: Enhanced stability and error recovery for the Inventory tab to prevent blank pages and ensure consistent data display
- **Type-safe image handling**: Comprehensive type checking and error boundaries for all product image displays to prevent runtime errors from ExternalBlob type mishandling
- **Safe URL generation**: Proper handling of image URL generation without attempting to call getDirectURL as a function, with appropriate fallbacks for invalid or missing images
