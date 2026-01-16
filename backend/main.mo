import AccessControl "authorization/access-control";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import Stripe "stripe/stripe";
import OutCall "http-outcalls/outcall";
import OrderedMap "mo:base/OrderedMap";
import Principal "mo:base/Principal";
import Debug "mo:base/Debug";
import Text "mo:base/Text";
import Iter "mo:base/Iter";
import Time "mo:base/Time";
import Float "mo:base/Float";
import List "mo:base/List";

import UserApproval "user-approval/approval";

actor Resona {
  // Authorization
  let accessControlState = AccessControl.initState();

  public shared ({ caller }) func initializeAccessControl() : async () {
    AccessControl.initialize(accessControlState, caller);
  };

  public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
    AccessControl.getUserRole(accessControlState, caller);
  };

  public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
    // Admin-only check happens inside assignRole
    AccessControl.assignRole(accessControlState, caller, user, role);
  };

  public query ({ caller }) func isCallerAdmin() : async Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };

  // Extended User Profile with Application Roles
  public type AppRole = {
    #artist;
    #buyer;
    #hub;
    #admin;
  };

  public type UserProfile = {
    name : Text;
    email : Text;
    role : AccessControl.UserRole;
    appRole : AppRole;
    hubId : ?Text; // Associate hub users with their hub
  };

  transient let principalMap = OrderedMap.Make<Principal>(Principal.compare);
  var userProfiles = principalMap.empty<UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can view profiles");
    };
    principalMap.get(userProfiles, caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Unauthorized: Can only view your own profile");
    };
    principalMap.get(userProfiles, user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles := principalMap.put(userProfiles, caller, profile);
  };

  // Helper function to get app role
  private func getAppRole(user : Principal) : ?AppRole {
    switch (principalMap.get(userProfiles, user)) {
      case null null;
      case (?profile) ?profile.appRole;
    };
  };

  private func isArtist(user : Principal) : Bool {
    switch (getAppRole(user)) {
      case (?#artist) true;
      case _ false;
    };
  };

  private func isBuyer(user : Principal) : Bool {
    switch (getAppRole(user)) {
      case (?#buyer) true;
      case _ false;
    };
  };

  private func isHub(user : Principal) : Bool {
    switch (getAppRole(user)) {
      case (?#hub) true;
      case _ false;
    };
  };

  private func getHubId(user : Principal) : ?Text {
    switch (principalMap.get(userProfiles, user)) {
      case null null;
      case (?profile) profile.hubId;
    };
  };

  // Storage
  let storage = Storage.new();
  include MixinStorage(storage);

  // Product Management
  public type ProductType = {
    #physical;
    #nft;
    #phygital;
  };

  public type Blockchain = {
    #icp;
    #ethereum;
    #solana;
  };

  public type Product = {
    id : Text;
    artist : Principal;
    name : Text;
    description : Text;
    price : Nat;
    inventory : Nat;
    images : [Storage.ExternalBlob];
    productType : ProductType;
    blockchain : ?Blockchain;
    royaltyPercentage : ?Nat;
    unlockableContent : ?Text;
    supply : ?Nat;
    sku : ?Text;
    shippingDetails : ?Text;
    mintCertificate : Bool;
    attachNfcQrTag : Bool;
    authenticityLink : ?Text;
  };

  transient let textMap = OrderedMap.Make<Text>(Text.compare);
  var products = textMap.empty<Product>();

  public query func getProducts() : async [Product] {
    // Public catalog - guests can view products
    Iter.toArray(textMap.vals(products));
  };

  public query func getArtistProducts(artist : Principal) : async [Product] {
    // Public catalog - guests can view artist products
    let allProducts = Iter.toArray(textMap.vals(products));
    Iter.toArray(
      Iter.filter<Product>(
        allProducts.vals(),
        func(p : Product) : Bool { Principal.equal(p.artist, artist) },
      )
    );
  };

  public shared ({ caller }) func addProduct(product : Product) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can add products");
    };
    if (not isArtist(caller) and not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Unauthorized: Only artists can add products");
    };
    if (not Principal.equal(product.artist, caller) and not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Unauthorized: Can only add products for yourself");
    };
    products := textMap.put(products, product.id, product);
  };

  public shared ({ caller }) func updateProduct(product : Product) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can update products");
    };

    switch (textMap.get(products, product.id)) {
      case null Debug.trap("Product not found");
      case (?existingProduct) {
        if (not Principal.equal(existingProduct.artist, caller) and not AccessControl.isAdmin(accessControlState, caller)) {
          Debug.trap("Unauthorized: Can only update your own products");
        };
        if (not isArtist(caller) and not AccessControl.isAdmin(accessControlState, caller)) {
          Debug.trap("Unauthorized: Only artists can update products");
        };
        products := textMap.put(products, product.id, product);
      };
    };
  };

  public shared ({ caller }) func deleteProduct(productId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can delete products");
    };

    switch (textMap.get(products, productId)) {
      case null Debug.trap("Product not found");
      case (?product) {
        if (not Principal.equal(product.artist, caller) and not AccessControl.isAdmin(accessControlState, caller)) {
          Debug.trap("Unauthorized: Can only delete your own products");
        };
        if (not isArtist(caller) and not AccessControl.isAdmin(accessControlState, caller)) {
          Debug.trap("Unauthorized: Only artists can delete products");
        };
        products := textMap.delete(products, productId);
      };
    };
  };

  // Certificate Management
  public type Certificate = {
    id : Text;
    productId : Text;
    artistId : Principal;
    metadataHash : Text;
    timestamp : Time.Time;
    version : Nat;
    blockchain : Blockchain;
    authenticityLink : Text;
  };

  var certificates = textMap.empty<Certificate>();

  public shared ({ caller }) func mintCertificate(certificate : Certificate) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can mint certificates");
    };
    if (not isArtist(caller) and not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Unauthorized: Only artists can mint certificates");
    };
    if (not Principal.equal(certificate.artistId, caller) and not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Unauthorized: Can only mint certificates for yourself");
    };
    
    // Verify product exists and belongs to the artist
    switch (textMap.get(products, certificate.productId)) {
      case null Debug.trap("Product not found");
      case (?product) {
        if (not Principal.equal(product.artist, certificate.artistId)) {
          Debug.trap("Unauthorized: Product does not belong to the specified artist");
        };
      };
    };
    
    certificates := textMap.put(certificates, certificate.id, certificate);
  };

  public query func verifyProduct(productId : Text) : async {
    product : ?Product;
    certificate : ?Certificate;
  } {
    // Public endpoint for external verification - no authentication required
    let product = textMap.get(products, productId);
    let certificate = switch (product) {
      case null null;
      case (?p) {
        let allCertificates = Iter.toArray(textMap.vals(certificates));
        let matchingCertificates = Iter.toArray(
          Iter.filter<Certificate>(
            allCertificates.vals(),
            func(c : Certificate) : Bool { Text.equal(c.productId, productId) },
          )
        );
        if (matchingCertificates.size() > 0) {
          ?matchingCertificates[0];
        } else {
          null;
        };
      };
    };
    { product; certificate };
  };

  // Order Processing
  public type OrderStatus = {
    #pending;
    #assigned;
    #processing;
    #shipped;
    #delivered;
  };

  public type Order = {
    id : Text;
    buyer : Principal;
    productId : Text;
    quantity : Nat;
    status : OrderStatus;
    assignedHub : ?Text;
    createdAt : Time.Time;
    updatedAt : Time.Time;
  };

  var orders = textMap.empty<Order>();

  public query ({ caller }) func getOrders() : async [Order] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Unauthorized: Only admins can view all orders");
    };
    Iter.toArray(textMap.vals(orders));
  };

  public query ({ caller }) func getBuyerOrders() : async [Order] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can view orders");
    };
    if (not isBuyer(caller) and not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Unauthorized: Only buyers can view their orders");
    };

    if (AccessControl.isAdmin(accessControlState, caller)) {
      return Iter.toArray(textMap.vals(orders));
    };

    let allOrders = Iter.toArray(textMap.vals(orders));
    Iter.toArray(
      Iter.filter<Order>(
        allOrders.vals(),
        func(o : Order) : Bool { Principal.equal(o.buyer, caller) },
      )
    );
  };

  public query ({ caller }) func getHubOrders(hubId : Text) : async [Order] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can view orders");
    };

    // Verify caller is associated with the requested hub or is admin
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      // Check hub ownership
      switch (textMap.get(hubOwners, hubId)) {
        case null Debug.trap("Hub not found");
        case (?owner) {
          if (not Principal.equal(owner, caller)) {
            Debug.trap("Unauthorized: Can only view orders for your own hub");
          };
        };
      };
    };

    let allOrders = Iter.toArray(textMap.vals(orders));
    Iter.toArray(
      Iter.filter<Order>(
        allOrders.vals(),
        func(o : Order) : Bool {
          switch (o.assignedHub) {
            case (?hub) Text.equal(hub, hubId);
            case null false;
          }
        },
      )
    );
  };

  public query ({ caller }) func getArtistOrders(artistId : Principal) : async [Order] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can view orders");
    };
    if (not Principal.equal(caller, artistId) and not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Unauthorized: Can only view orders for your own products");
    };
    if (not isArtist(caller) and not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Unauthorized: Only artists can view product orders");
    };

    let allOrders = Iter.toArray(textMap.vals(orders));
    Iter.toArray(
      Iter.filter<Order>(
        allOrders.vals(),
        func(o : Order) : Bool {
          switch (textMap.get(products, o.productId)) {
            case (?product) Principal.equal(product.artist, artistId);
            case null false;
          }
        },
      )
    );
  };

  public shared ({ caller }) func placeOrder(order : Order) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can place orders");
    };
    if (not isBuyer(caller) and not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Unauthorized: Only buyers can place orders");
    };
    if (not Principal.equal(order.buyer, caller) and not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Unauthorized: Can only place orders for yourself");
    };
    
    // Verify product exists and has sufficient inventory
    switch (textMap.get(products, order.productId)) {
      case null Debug.trap("Product not found");
      case (?product) {
        if (product.inventory < order.quantity) {
          Debug.trap("Insufficient inventory for this order");
        };
      };
    };
    
    orders := textMap.put(orders, order.id, order);
  };

  public shared ({ caller }) func updateOrderStatus(orderId : Text, status : OrderStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can update order status");
    };

    switch (textMap.get(orders, orderId)) {
      case null Debug.trap("Order not found");
      case (?order) {
        // Authorization based on status transition
        let canUpdate = switch (status) {
          case (#pending) AccessControl.isAdmin(accessControlState, caller); // Only admin can revert to pending
          case (#assigned) AccessControl.isAdmin(accessControlState, caller); // Only admin can assign
          case (#processing) {
            // Hub can mark as processing if assigned to them
            switch (order.assignedHub) {
              case null false;
              case (?hubId) {
                if (AccessControl.isAdmin(accessControlState, caller)) {
                  true;
                } else {
                  // Check hub ownership
                  switch (textMap.get(hubOwners, hubId)) {
                    case null false;
                    case (?owner) Principal.equal(owner, caller);
                  };
                };
              };
            };
          };
          case (#shipped) {
            // Hub can mark as shipped if assigned to them
            switch (order.assignedHub) {
              case null false;
              case (?hubId) {
                if (AccessControl.isAdmin(accessControlState, caller)) {
                  true;
                } else {
                  // Check hub ownership
                  switch (textMap.get(hubOwners, hubId)) {
                    case null false;
                    case (?owner) Principal.equal(owner, caller);
                  };
                };
              };
            };
          };
          case (#delivered) {
            // Hub (if assigned) or buyer can mark as delivered
            let isBuyerOfOrder = Principal.equal(order.buyer, caller);
            let isAssignedHub = switch (order.assignedHub) {
              case null false;
              case (?hubId) {
                switch (textMap.get(hubOwners, hubId)) {
                  case null false;
                  case (?owner) Principal.equal(owner, caller);
                };
              };
            };
            isBuyerOfOrder or isAssignedHub or AccessControl.isAdmin(accessControlState, caller);
          };
        };

        if (not canUpdate) {
          Debug.trap("Unauthorized: Cannot update order status to this state");
        };

        let updatedOrder = {
          order with
          status;
          updatedAt = Time.now();
        };
        orders := textMap.put(orders, orderId, updatedOrder);
      };
    };
  };

  public shared ({ caller }) func assignOrderToHub(orderId : Text, hubId : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Unauthorized: Only admins can assign orders to hubs");
    };

    switch (textMap.get(orders, orderId)) {
      case null Debug.trap("Order not found");
      case (?order) {
        // Verify hub exists and is approved
        switch (textMap.get(hubs, hubId)) {
          case null Debug.trap("Hub not found");
          case (?hub) {
            if (hub.status != #approved) {
              Debug.trap("Cannot assign order to non-approved hub");
            };
            let updatedOrder = {
              order with
              assignedHub = ?hubId;
              status = #assigned;
              updatedAt = Time.now();
            };
            orders := textMap.put(orders, orderId, updatedOrder);
          };
        };
      };
    };
  };

  // Fulfillment Hubs
  public type HubStatus = {
    #draft;
    #pendingApproval;
    #approved;
    #rejected;
    #suspended;
  };

  public type Hub = {
    id : Text;
    name : Text;
    location : (Float, Float);
    capacity : Nat;
    status : HubStatus;
    businessInfo : Text;
    contactInfo : Text;
    services : Text;
    createdAt : Time.Time;
    updatedAt : Time.Time;
  };

  var hubs = textMap.empty<Hub>();
  var hubOwners = textMap.empty<Principal>(); // Maps hubId -> owner Principal

  public query func getHubs() : async [Hub] {
    // Public - buyers and artists need to see approved hubs only
    let allHubs = Iter.toArray(textMap.vals(hubs));
    Iter.toArray(
      Iter.filter<Hub>(
        allHubs.vals(),
        func(h : Hub) : Bool { h.status == #approved },
      )
    );
  };

  public query ({ caller }) func getAllHubs() : async [Hub] {
    // Admin-only - view all hubs regardless of status
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Unauthorized: Only admins can view all hubs");
    };
    Iter.toArray(textMap.vals(hubs));
  };

  public query ({ caller }) func getPendingHubs() : async [Hub] {
    // Admin-only - view only pending hubs
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Unauthorized: Only admins can view pending hubs");
    };
    let allHubs = Iter.toArray(textMap.vals(hubs));
    Iter.toArray(
      Iter.filter<Hub>(
        allHubs.vals(),
        func(h : Hub) : Bool { h.status == #pendingApproval },
      )
    );
  };

  public query ({ caller }) func getCallerHubs() : async [Hub] {
    // Returns all hubs owned by the caller
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can view their hubs");
    };

    let allHubs = Iter.toArray(textMap.vals(hubs));
    Iter.toArray(
      Iter.filter<Hub>(
        allHubs.vals(),
        func(h : Hub) : Bool {
          switch (textMap.get(hubOwners, h.id)) {
            case null false;
            case (?owner) Principal.equal(owner, caller);
          };
        },
      )
    );
  };

  public query ({ caller }) func getCallerHub() : async ?Hub {
    // Returns the single hub owned by the caller (or null if none exists)
    // This is the primary function for hub users to get their hub information
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can view their hub");
    };

    let allHubs = Iter.toArray(textMap.vals(hubs));
    let callerHubs = Iter.toArray(
      Iter.filter<Hub>(
        allHubs.vals(),
        func(h : Hub) : Bool {
          switch (textMap.get(hubOwners, h.id)) {
            case null false;
            case (?owner) Principal.equal(owner, caller);
          };
        },
      )
    );

    if (callerHubs.size() > 0) {
      ?callerHubs[0];
    } else {
      null;
    };
  };

  public query ({ caller }) func getHubById(hubId : Text) : async ?Hub {
    // Returns a specific hub by ID with authorization checks
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can view hub details");
    };

    switch (textMap.get(hubs, hubId)) {
      case null null;
      case (?hub) {
        // Authorization: Hub owner or admin
        let isHubOwner = switch (textMap.get(hubOwners, hubId)) {
          case null false;
          case (?owner) Principal.equal(owner, caller);
        };

        if (not isHubOwner and not AccessControl.isAdmin(accessControlState, caller)) {
          Debug.trap("Unauthorized: Can only view your own hub details");
        };
        ?hub;
      };
    };
  };

  public shared ({ caller }) func applyForHub(hubApplication : {
    id : Text;
    name : Text;
    location : (Float, Float);
    capacity : Nat;
    businessInfo : Text;
    contactInfo : Text;
    services : Text;
  }) : async () {
    // Any registered user can apply to create a new hub
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can apply for hubs");
    };
    
    // Check if hub ID already exists
    switch (textMap.get(hubs, hubApplication.id)) {
      case (?_existing) Debug.trap("Hub with this ID already exists");
      case null {
        // Create new hub with draft status (not yet submitted for approval)
        let newHub : Hub = {
          id = hubApplication.id;
          name = hubApplication.name;
          location = hubApplication.location;
          capacity = hubApplication.capacity;
          status = #draft; // Start as draft, user must explicitly submit for approval
          businessInfo = hubApplication.businessInfo;
          contactInfo = hubApplication.contactInfo;
          services = hubApplication.services;
          createdAt = Time.now();
          updatedAt = Time.now();
        };
        hubs := textMap.put(hubs, newHub.id, newHub);
        // Record ownership
        hubOwners := textMap.put(hubOwners, newHub.id, caller);
      };
    };
  };

  public shared ({ caller }) func submitHubForApproval(hubId : Text) : async () {
    // Hub owners can submit their hub for approval
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can submit hubs for approval");
    };

    switch (textMap.get(hubs, hubId)) {
      case null Debug.trap("Hub not found");
      case (?hub) {
        // Verify caller is the hub owner
        let isHubOwner = switch (textMap.get(hubOwners, hubId)) {
          case null false;
          case (?owner) Principal.equal(owner, caller);
        };

        if (not isHubOwner) {
          Debug.trap("Unauthorized: Can only submit your own hub for approval");
        };

        // Only draft or rejected hubs can be submitted for approval
        if (hub.status != #draft and hub.status != #rejected) {
          Debug.trap("Hub cannot be submitted for approval in its current status");
        };

        let updatedHub = {
          hub with
          status = #pendingApproval;
          updatedAt = Time.now();
        };
        hubs := textMap.put(hubs, hubId, updatedHub);
      };
    };
  };

  public shared ({ caller }) func updateHub(hub : Hub) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can update hubs");
    };

    switch (textMap.get(hubs, hub.id)) {
      case null Debug.trap("Hub not found");
      case (?existingHub) {
        // Authorization: Hub owner or admin
        let isHubOwner = switch (textMap.get(hubOwners, hub.id)) {
          case null false;
          case (?owner) Principal.equal(owner, caller);
        };

        if (not isHubOwner and not AccessControl.isAdmin(accessControlState, caller)) {
          Debug.trap("Unauthorized: Can only update your own hub");
        };

        // Hub owners cannot change status - only admins can
        // Hub owners also cannot update if status is pendingApproval (must wait for admin decision)
        if (not AccessControl.isAdmin(accessControlState, caller)) {
          if (existingHub.status == #pendingApproval) {
            Debug.trap("Cannot update hub while pending approval");
          };
        };

        let finalStatus = if (AccessControl.isAdmin(accessControlState, caller)) {
          hub.status;
        } else {
          existingHub.status;
        };

        let updatedHub = {
          existingHub with
          name = hub.name;
          location = hub.location;
          capacity = hub.capacity;
          businessInfo = hub.businessInfo;
          contactInfo = hub.contactInfo;
          services = hub.services;
          status = finalStatus;
          updatedAt = Time.now();
        };
        hubs := textMap.put(hubs, hub.id, updatedHub);
      };
    };
  };

  public shared ({ caller }) func deleteHub(hubId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can delete hubs");
    };
    hubs := textMap.delete(hubs, hubId);
    hubOwners := textMap.delete(hubOwners, hubId);
  };

  public shared ({ caller }) func approveHub(hubId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can approve hubs");
    };

    switch (textMap.get(hubs, hubId)) {
      case null Debug.trap("Hub not found");
      case (?hub) {
        if (hub.status != #pendingApproval) {
          Debug.trap("Can only approve hubs with pending approval status");
        };
        let updatedHub = {
          hub with
          status = #approved;
          updatedAt = Time.now();
        };
        hubs := textMap.put(hubs, hubId, updatedHub);
      };
    };
  };

  public shared ({ caller }) func rejectHub(hubId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can reject hubs");
    };

    switch (textMap.get(hubs, hubId)) {
      case null Debug.trap("Hub not found");
      case (?hub) {
        if (hub.status != #pendingApproval) {
          Debug.trap("Can only reject hubs with pending approval status");
        };
        let updatedHub = {
          hub with
          status = #rejected;
          updatedAt = Time.now();
        };
        hubs := textMap.put(hubs, hubId, updatedHub);
      };
    };
  };

  public shared ({ caller }) func suspendHub(hubId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can suspend hubs");
    };

    switch (textMap.get(hubs, hubId)) {
      case null Debug.trap("Hub not found");
      case (?hub) {
        if (hub.status != #approved) {
          Debug.trap("Can only suspend approved hubs");
        };
        let updatedHub = {
          hub with
          status = #suspended;
          updatedAt = Time.now();
        };
        hubs := textMap.put(hubs, hubId, updatedHub);
      };
    };
  };

  public shared ({ caller }) func reactivateHub(hubId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can reactivate hubs");
    };

    switch (textMap.get(hubs, hubId)) {
      case null Debug.trap("Hub not found");
      case (?hub) {
        if (hub.status != #suspended) {
          Debug.trap("Can only reactivate suspended hubs");
        };
        let updatedHub = {
          hub with
          status = #approved;
          updatedAt = Time.now();
        };
        hubs := textMap.put(hubs, hubId, updatedHub);
      };
    };
  };

  // Payment System
  public type Payment = {
    id : Text;
    orderId : Text;
    artistAmount : Nat;
    hubAmount : Nat;
    platformAmount : Nat;
    totalAmount : Nat;
    timestamp : Time.Time;
  };

  var payments = textMap.empty<Payment>();

  public query ({ caller }) func getPayments() : async [Payment] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can view all payments");
    };
    Iter.toArray(textMap.vals(payments));
  };

  public query ({ caller }) func getArtistPayments(artistId : Principal) : async [Payment] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can view payments");
    };
    if (not Principal.equal(caller, artistId) and not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Unauthorized: Can only view your own payments");
    };
    if (not isArtist(caller) and not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Unauthorized: Only artists can view payments");
    };

    let allPayments = Iter.toArray(textMap.vals(payments));
    Iter.toArray(
      Iter.filter<Payment>(
        allPayments.vals(),
        func(p : Payment) : Bool {
          switch (textMap.get(orders, p.orderId)) {
            case (?order) {
              switch (textMap.get(products, order.productId)) {
                case (?product) Principal.equal(product.artist, artistId);
                case null false;
              };
            };
            case null false;
          }
        },
      )
    );
  };

  public shared ({ caller }) func recordPayment(payment : Payment) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can record payments");
    };
    
    // Verify order exists
    switch (textMap.get(orders, payment.orderId)) {
      case null Debug.trap("Order not found");
      case (?_order) {
        payments := textMap.put(payments, payment.id, payment);
      };
    };
  };

  // Stripe Integration
  var stripeConfig : ?Stripe.StripeConfiguration = null;

  public query func isStripeConfigured() : async Bool {
    // Public - frontend needs to check configuration status
    stripeConfig != null;
  };

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can configure Stripe");
    };
    stripeConfig := ?config;
  };

  private func getStripeConfiguration() : Stripe.StripeConfiguration {
    switch (stripeConfig) {
      case null Debug.trap("Stripe needs to be first configured");
      case (?value) value;
    };
  };

  public shared ({ caller }) func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can check session status");
    };
    await Stripe.getSessionStatus(getStripeConfiguration(), sessionId, transform);
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can create checkout sessions");
    };
    if (not isBuyer(caller) and not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Unauthorized: Only buyers can create checkout sessions");
    };
    await Stripe.createCheckoutSession(getStripeConfiguration(), caller, items, successUrl, cancelUrl, transform);
  };

  // HTTP Outcalls
  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    // Public - required for HTTP outcalls system
    OutCall.transform(input);
  };

  // Analytics & Reporting
  public type ArtistDashboardSummary = {
    totalSales : Nat;
    totalSalesChange : Float;
    activeFans : Nat;
    activeFansGrowth : Float;
    pendingOrders : Nat;
    urgentOrders : Nat;
    monthlyRevenue : Nat;
    monthlyRevenueGrowth : Float;
    productsPublished : Nat;
    averageOrderValue : Float;
    customerSatisfaction : Float;
    fulfillmentTime : Float;
    topTracks : [Text];
    actionItems : [Text];
    announcements : [Text];
  };

  public query ({ caller }) func getArtistDashboardSummary(artistId : Principal) : async ArtistDashboardSummary {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can view dashboard summary");
    };
    if (not Principal.equal(caller, artistId) and not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Unauthorized: Can only view your own dashboard summary");
    };
    if (not isArtist(caller) and not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Unauthorized: Only artists can view dashboard summary");
    };

    // Calculate metrics
    let artistProducts = Iter.toArray(
      Iter.filter<Product>(
        textMap.vals(products),
        func(p : Product) : Bool { Principal.equal(p.artist, artistId) },
      )
    );

    let artistOrders = Iter.toArray(
      Iter.filter<Order>(
        textMap.vals(orders),
        func(o : Order) : Bool {
          switch (textMap.get(products, o.productId)) {
            case (?product) Principal.equal(product.artist, artistId);
            case null false;
          }
        },
      )
    );

    let artistPayments = Iter.toArray(
      Iter.filter<Payment>(
        textMap.vals(payments),
        func(p : Payment) : Bool {
          switch (textMap.get(orders, p.orderId)) {
            case (?order) {
              switch (textMap.get(products, order.productId)) {
                case (?product) Principal.equal(product.artist, artistId);
                case null false;
              };
            };
            case null false;
          }
        },
      )
    );

    let totalSales = artistPayments.size();
    let totalSalesChange = 0.0; // Placeholder for percentage change calculation
    let activeFans = 100; // Placeholder for active fans count
    let activeFansGrowth = 0.0; // Placeholder for growth calculation
    let pendingOrders = artistOrders.size();
    let urgentOrders = 5; // Placeholder for urgent orders count
    let monthlyRevenue = 10000; // Placeholder for monthly revenue
    let monthlyRevenueGrowth = 0.0; // Placeholder for growth calculation
    let productsPublished = artistProducts.size();
    let averageOrderValue = 50.0; // Placeholder for average order value
    let customerSatisfaction = 4.5; // Placeholder for customer satisfaction rating
    let fulfillmentTime = 2.5; // Placeholder for fulfillment time in days
    let topTracks = ["Track 1", "Track 2", "Track 3"]; // Placeholder for top tracks
    let actionItems = ["Update inventory", "Respond to customer inquiries", "Review pending orders"]; // Placeholder for action items
    let announcements = ["New feature release", "Platform maintenance scheduled"]; // Placeholder for announcements

    {
      totalSales;
      totalSalesChange;
      activeFans;
      activeFansGrowth;
      pendingOrders;
      urgentOrders;
      monthlyRevenue;
      monthlyRevenueGrowth;
      productsPublished;
      averageOrderValue;
      customerSatisfaction;
      fulfillmentTime;
      topTracks;
      actionItems;
      announcements;
    };
  };

  // Artist Order Tracking Enhancements
  public type OrderFilter = {
    status : ?OrderStatus;
    startDate : ?Time.Time;
    endDate : ?Time.Time;
    hub : ?Text;
    searchTerm : ?Text;
  };

  public type OrderSummary = {
    totalOrders : Nat;
    inProduction : Nat;
    shipped : Nat;
    delivered : Nat;
    urgent : Nat;
    pending : Nat;
  };

  public query ({ caller }) func getArtistOrderSummary(artistId : Principal) : async OrderSummary {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can view order summary");
    };
    if (not Principal.equal(caller, artistId) and not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Unauthorized: Can only view your own order summary");
    };
    if (not isArtist(caller) and not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Unauthorized: Only artists can view order summary");
    };

    let artistOrders = Iter.toArray(
      Iter.filter<Order>(
        textMap.vals(orders),
        func(o : Order) : Bool {
          switch (textMap.get(products, o.productId)) {
            case (?product) Principal.equal(product.artist, artistId);
            case null false;
          }
        },
      )
    );

    var inProduction = 0;
    var shipped = 0;
    var delivered = 0;
    var urgent = 0;
    var pending = 0;

    for (order in artistOrders.vals()) {
      switch (order.status) {
        case (#processing) inProduction += 1;
        case (#shipped) shipped += 1;
        case (#delivered) delivered += 1;
        case (#pending) pending += 1;
        case (#assigned) urgent += 1;
      };
    };

    {
      totalOrders = artistOrders.size();
      inProduction;
      shipped;
      delivered;
      urgent;
      pending;
    };
  };

  public query ({ caller }) func getFilteredArtistOrders(artistId : Principal, filter : OrderFilter) : async [Order] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can view filtered orders");
    };
    if (not Principal.equal(caller, artistId) and not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Unauthorized: Can only view your own filtered orders");
    };
    if (not isArtist(caller) and not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Unauthorized: Only artists can view filtered orders");
    };

    let artistOrders = Iter.toArray(
      Iter.filter<Order>(
        textMap.vals(orders),
        func(o : Order) : Bool {
          switch (textMap.get(products, o.productId)) {
            case (?product) Principal.equal(product.artist, artistId);
            case null false;
          }
        },
      )
    );

    var filteredOrders = List.fromArray<Order>(artistOrders);

    // Apply status filter
    switch (filter.status) {
      case null {};
      case (?status) {
        filteredOrders := List.filter<Order>(
          filteredOrders,
          func(o : Order) : Bool { o.status == status },
        );
      };
    };

    // Apply date range filter
    switch (filter.startDate, filter.endDate) {
      case (null, null) {};
      case (?start, null) {
        filteredOrders := List.filter<Order>(
          filteredOrders,
          func(o : Order) : Bool { o.createdAt >= start },
        );
      };
      case (null, ?end) {
        filteredOrders := List.filter<Order>(
          filteredOrders,
          func(o : Order) : Bool { o.createdAt <= end },
        );
      };
      case (?start, ?end) {
        filteredOrders := List.filter<Order>(
          filteredOrders,
          func(o : Order) : Bool { o.createdAt >= start and o.createdAt <= end },
        );
      };
    };

    // Apply hub filter
    switch (filter.hub) {
      case null {};
      case (?hubId) {
        filteredOrders := List.filter<Order>(
          filteredOrders,
          func(o : Order) : Bool {
            switch (o.assignedHub) {
              case (?hub) Text.equal(hub, hubId);
              case null false;
            }
          },
        );
      };
    };

    // Apply search term filter
    switch (filter.searchTerm) {
      case null {};
      case (?term) {
        let lowerTerm = Text.toLowercase(term);
        filteredOrders := List.filter<Order>(
          filteredOrders,
          func(o : Order) : Bool {
            let orderIdMatch = Text.contains(Text.toLowercase(o.id), #text lowerTerm);
            let customerMatch = switch (principalMap.get(userProfiles, o.buyer)) {
              case null false;
              case (?profile) {
                Text.contains(Text.toLowercase(profile.name), #text lowerTerm) or Text.contains(Text.toLowercase(profile.email), #text lowerTerm);
              };
            };
            orderIdMatch or customerMatch;
          },
        );
      };
    };

    List.toArray(filteredOrders);
  };

  public query ({ caller }) func getOrderDetails(orderId : Text) : async ?Order {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can view order details");
    };

    switch (textMap.get(orders, orderId)) {
      case null null;
      case (?order) {
        // Authorization check: artist, buyer, assigned hub, or admin can view
        let isOrderArtist = switch (textMap.get(products, order.productId)) {
          case null false;
          case (?product) Principal.equal(product.artist, caller);
        };

        let isOrderBuyer = Principal.equal(order.buyer, caller);

        let isAssignedHub = switch (order.assignedHub) {
          case null false;
          case (?hubId) {
            switch (textMap.get(hubOwners, hubId)) {
              case null false;
              case (?owner) Principal.equal(owner, caller);
            };
          };
        };

        if (not isOrderArtist and not isOrderBuyer and not isAssignedHub and not AccessControl.isAdmin(accessControlState, caller)) {
          Debug.trap("Unauthorized: Can only view order details if you are the artist, buyer, assigned hub, or admin");
        };
        ?order;
      };
    };
  };

  // Inventory Management
  public type InventoryStatus = {
    #inStock;
    #pending;
    #lowStock;
    #outOfStock;
  };

  public type InventoryItem = {
    productId : Text;
    hubId : Text;
    stock : Nat;
    pending : Nat;
    status : InventoryStatus;
    lastUpdated : Time.Time;
  };

  public type HubActivity = {
    hubId : Text;
    activityType : {
      #unitsShipped : Nat;
      #lowStockAlert : Nat;
      #newOrder : Nat;
    };
    timestamp : Time.Time;
  };

  public type InventorySummary = {
    hubName : Text;
    location : (Float, Float);
    status : Text;
    inStock : Nat;
    pending : Nat;
    lowStock : Nat;
    totalUnits : Nat;
  };

  public type LowStockAlert = {
    productName : Text;
    hubLocation : (Float, Float);
    stock : Nat;
    threshold : Nat;
    lastUpdated : Time.Time;
  };

  var inventory = textMap.empty<InventoryItem>();
  var hubActivities = textMap.empty<HubActivity>();

  // Helper function to check if artist has products in a hub
  private func artistHasProductsInHub(artistId : Principal, hubId : Text) : Bool {
    let hubInventory = Iter.toArray(
      Iter.filter<InventoryItem>(
        textMap.vals(inventory),
        func(i : InventoryItem) : Bool { Text.equal(i.hubId, hubId) },
      )
    );
    
    for (item in hubInventory.vals()) {
      switch (textMap.get(products, item.productId)) {
        case (?product) {
          if (Principal.equal(product.artist, artistId)) {
            return true;
          };
        };
        case null {};
      };
    };
    false;
  };

  // Helper function to generate inventory item ID
  private func makeInventoryId(productId : Text, hubId : Text) : Text {
    productId # "-" # hubId;
  };

  public query ({ caller }) func getInventoryByHub(hubId : Text) : async [InventoryItem] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can view inventory");
    };

    // Authorization: Hub owner, artist with products in hub, or admin
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      let isHubOwner = switch (textMap.get(hubOwners, hubId)) {
        case null false;
        case (?owner) Principal.equal(owner, caller);
      };

      let isArtistWithProducts = isArtist(caller) and artistHasProductsInHub(caller, hubId);

      if (not isHubOwner and not isArtistWithProducts) {
        Debug.trap("Unauthorized: Can only view inventory for your own hub or hubs with your products");
      };
    };

    let allInventory = Iter.toArray(textMap.vals(inventory));
    Iter.toArray(
      Iter.filter<InventoryItem>(
        allInventory.vals(),
        func(i : InventoryItem) : Bool { Text.equal(i.hubId, hubId) },
      )
    );
  };

  public query ({ caller }) func getProductInventoryByHub(productId : Text) : async [InventoryItem] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can view product inventory");
    };

    // Verify caller is the product's artist or admin
    switch (textMap.get(products, productId)) {
      case null Debug.trap("Product not found");
      case (?product) {
        if (not Principal.equal(product.artist, caller) and not AccessControl.isAdmin(accessControlState, caller)) {
          Debug.trap("Unauthorized: Can only view inventory for your own products");
        };
      };
    };

    let allInventory = Iter.toArray(textMap.vals(inventory));
    Iter.toArray(
      Iter.filter<InventoryItem>(
        allInventory.vals(),
        func(i : InventoryItem) : Bool { Text.equal(i.productId, productId) },
      )
    );
  };

  public query ({ caller }) func getArtistInventory() : async [InventoryItem] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can view inventory");
    };
    if (not isArtist(caller) and not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Unauthorized: Only artists can view their inventory");
    };

    let allInventory = Iter.toArray(textMap.vals(inventory));
    Iter.toArray(
      Iter.filter<InventoryItem>(
        allInventory.vals(),
        func(i : InventoryItem) : Bool {
          switch (textMap.get(products, i.productId)) {
            case null false;
            case (?product) Principal.equal(product.artist, caller) or AccessControl.isAdmin(accessControlState, caller);
          }
        },
      )
    );
  };

  public shared ({ caller }) func assignProductToHub(productId : Text, hubId : Text, initialStock : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can assign products to hubs");
    };
    if (not isArtist(caller) and not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Unauthorized: Only artists can assign products to hubs");
    };

    // Verify product exists and belongs to caller
    switch (textMap.get(products, productId)) {
      case null Debug.trap("Product not found");
      case (?product) {
        if (not Principal.equal(product.artist, caller) and not AccessControl.isAdmin(accessControlState, caller)) {
          Debug.trap("Unauthorized: Can only assign your own products to hubs");
        };
      };
    };

    // Verify hub exists and is approved
    switch (textMap.get(hubs, hubId)) {
      case null Debug.trap("Hub not found");
      case (?hub) {
        if (hub.status != #approved) {
          Debug.trap("Can only assign products to approved hubs");
        };
        let inventoryId = makeInventoryId(productId, hubId);
        
        // Check if already assigned
        switch (textMap.get(inventory, inventoryId)) {
          case (?_existing) Debug.trap("Product already assigned to this hub");
          case null {
            let newInventoryItem : InventoryItem = {
              productId;
              hubId;
              stock = initialStock;
              pending = 0;
              status = if (initialStock > 10) #inStock else if (initialStock > 0) #lowStock else #outOfStock;
              lastUpdated = Time.now();
            };
            inventory := textMap.put(inventory, inventoryId, newInventoryItem);
          };
        };
      };
    };
  };

  public shared ({ caller }) func removeProductFromHub(productId : Text, hubId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can remove products from hubs");
    };
    if (not isArtist(caller) and not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Unauthorized: Only artists can remove products from hubs");
    };

    // Verify product exists and belongs to caller
    switch (textMap.get(products, productId)) {
      case null Debug.trap("Product not found");
      case (?product) {
        if (not Principal.equal(product.artist, caller) and not AccessControl.isAdmin(accessControlState, caller)) {
          Debug.trap("Unauthorized: Can only remove your own products from hubs");
        };
      };
    };

    let inventoryId = makeInventoryId(productId, hubId);
    inventory := textMap.delete(inventory, inventoryId);
  };

  public shared ({ caller }) func updateProductHubStock(productId : Text, hubId : Text, newStock : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can update stock");
    };

    let inventoryId = makeInventoryId(productId, hubId);
    
    switch (textMap.get(inventory, inventoryId)) {
      case null Debug.trap("Inventory item not found");
      case (?item) {
        // Authorization: Artist who owns the product, hub owner, or admin
        let isProductArtist = switch (textMap.get(products, productId)) {
          case null false;
          case (?product) Principal.equal(product.artist, caller);
        };

        let isHubOwner = switch (textMap.get(hubOwners, hubId)) {
          case null false;
          case (?owner) Principal.equal(owner, caller);
        };

        if (not isProductArtist and not isHubOwner and not AccessControl.isAdmin(accessControlState, caller)) {
          Debug.trap("Unauthorized: Can only update stock for your own products or your hub");
        };

        let updatedItem = {
          item with
          stock = newStock;
          status = if (newStock > 10) #inStock else if (newStock > 0) #lowStock else #outOfStock;
          lastUpdated = Time.now();
        };
        inventory := textMap.put(inventory, inventoryId, updatedItem);
      };
    };
  };

  public query ({ caller }) func getHubInventorySummary(hubId : Text) : async InventorySummary {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can view inventory summary");
    };

    // Authorization: Hub owner, artist with products in hub, or admin
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      let isHubOwner = switch (textMap.get(hubOwners, hubId)) {
        case null false;
        case (?owner) Principal.equal(owner, caller);
      };

      let isArtistWithProducts = isArtist(caller) and artistHasProductsInHub(caller, hubId);

      if (not isHubOwner and not isArtistWithProducts) {
        Debug.trap("Unauthorized: Can only view inventory summary for your own hub or hubs with your products");
      };
    };

    switch (textMap.get(hubs, hubId)) {
      case null Debug.trap("Hub not found");
      case (?hub) {
        let hubInventory = Iter.toArray(
          Iter.filter<InventoryItem>(
            textMap.vals(inventory),
            func(i : InventoryItem) : Bool { Text.equal(i.hubId, hubId) },
          )
        );

        var inStock = 0;
        var pending = 0;
        var lowStock = 0;
        var totalUnits = 0;

        for (item in hubInventory.vals()) {
          inStock += item.stock;
          pending += item.pending;
          totalUnits += item.stock + item.pending;
          if (item.status == #lowStock) {
            lowStock += 1;
          };
        };

        {
          hubName = hub.name;
          location = hub.location;
          status = "active";
          inStock;
          pending;
          lowStock;
          totalUnits;
        };
      };
    };
  };

  public query ({ caller }) func getRecentHubActivity(hubId : Text) : async [HubActivity] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can view hub activity");
    };

    // Authorization: Hub owner, artist with products in hub, or admin
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      let isHubOwner = switch (textMap.get(hubOwners, hubId)) {
        case null false;
        case (?owner) Principal.equal(owner, caller);
      };

      let isArtistWithProducts = isArtist(caller) and artistHasProductsInHub(caller, hubId);

      if (not isHubOwner and not isArtistWithProducts) {
        Debug.trap("Unauthorized: Can only view activity for your own hub or hubs with your products");
      };
    };

    let allActivities = Iter.toArray(textMap.vals(hubActivities));
    Iter.toArray(
      Iter.filter<HubActivity>(
        allActivities.vals(),
        func(a : HubActivity) : Bool { Text.equal(a.hubId, hubId) },
      )
    );
  };

  public query ({ caller }) func getLowStockAlerts() : async [LowStockAlert] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can view low stock alerts");
    };

    // Artists see alerts for their products only, admins see all
    let allInventory = Iter.toArray(textMap.vals(inventory));
    let lowStockItems = Iter.toArray(
      Iter.filter<InventoryItem>(
        allInventory.vals(),
        func(i : InventoryItem) : Bool { 
          if (i.status != #lowStock) {
            return false;
          };
          
          // Filter by artist ownership if not admin
          if (not AccessControl.isAdmin(accessControlState, caller)) {
            if (not isArtist(caller)) {
              return false;
            };
            switch (textMap.get(products, i.productId)) {
              case null false;
              case (?product) Principal.equal(product.artist, caller);
            };
          } else {
            true;
          };
        },
      )
    );

    let alerts = List.map<InventoryItem, LowStockAlert>(
      List.fromArray(lowStockItems),
      func(item : InventoryItem) : LowStockAlert {
        let productName = switch (textMap.get(products, item.productId)) {
          case null "Unknown Product";
          case (?product) product.name;
        };
        let hubLocation = switch (textMap.get(hubs, item.hubId)) {
          case null (0.0, 0.0);
          case (?hub) hub.location;
        };
        {
          productName;
          hubLocation;
          stock = item.stock;
          threshold = 10; // Default threshold
          lastUpdated = item.lastUpdated;
        };
      },
    );

    List.toArray(alerts);
  };

  public shared ({ caller }) func restockInventory(inventoryId : Text, quantity : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can restock inventory");
    };

    switch (textMap.get(inventory, inventoryId)) {
      case null Debug.trap("Inventory item not found");
      case (?item) {
        // Authorization: Hub owner or admin
        if (not AccessControl.isAdmin(accessControlState, caller)) {
          let isHubOwner = switch (textMap.get(hubOwners, item.hubId)) {
            case null false;
            case (?owner) Principal.equal(owner, caller);
          };
          if (not isHubOwner) {
            Debug.trap("Unauthorized: Can only restock inventory for your own hub");
          };
        };

        let updatedItem = {
          item with
          stock = item.stock + quantity;
          status = if (item.stock + quantity > 10) #inStock else #lowStock;
          lastUpdated = Time.now();
        };
        inventory := textMap.put(inventory, inventoryId, updatedItem);
      };
    };
  };

  public shared ({ caller }) func bulkRestockInventory(items : [(Text, Nat)]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can bulk restock inventory");
    };

    for ((inventoryId, quantity) in items.vals()) {
      switch (textMap.get(inventory, inventoryId)) {
        case null {};
        case (?item) {
          // Verify hub ownership if not admin
          if (not AccessControl.isAdmin(accessControlState, caller)) {
            switch (textMap.get(hubOwners, item.hubId)) {
              case null {};
              case (?owner) {
                if (Principal.equal(owner, caller)) {
                  let updatedItem = {
                    item with
                    stock = item.stock + quantity;
                    status = if (item.stock + quantity > 10) #inStock else #lowStock;
                    lastUpdated = Time.now();
                  };
                  inventory := textMap.put(inventory, inventoryId, updatedItem);
                };
              };
            };
          } else {
            let updatedItem = {
              item with
              stock = item.stock + quantity;
              status = if (item.stock + quantity > 10) #inStock else #lowStock;
              lastUpdated = Time.now();
            };
            inventory := textMap.put(inventory, inventoryId, updatedItem);
          };
        };
      };
    };
  };

  public query ({ caller }) func exportInventoryReport() : async [InventoryItem] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can export inventory report");
    };

    // Artists export their products only, hubs export their hub only, admins export all
    let allInventory = Iter.toArray(textMap.vals(inventory));
    
    if (AccessControl.isAdmin(accessControlState, caller)) {
      return allInventory;
    };

    if (isArtist(caller)) {
      return Iter.toArray(
        Iter.filter<InventoryItem>(
          allInventory.vals(),
          func(i : InventoryItem) : Bool {
            switch (textMap.get(products, i.productId)) {
              case null false;
              case (?product) Principal.equal(product.artist, caller);
            };
          },
        )
      );
    };

    // Hub users export their hub's inventory
    let callerHubs = Iter.toArray(
      Iter.filter<Hub>(
        textMap.vals(hubs),
        func(h : Hub) : Bool {
          switch (textMap.get(hubOwners, h.id)) {
            case null false;
            case (?owner) Principal.equal(owner, caller);
          };
        },
      )
    );

    if (callerHubs.size() > 0) {
      let hubId = callerHubs[0].id;
      return Iter.toArray(
        Iter.filter<InventoryItem>(
          allInventory.vals(),
          func(i : InventoryItem) : Bool { Text.equal(i.hubId, hubId) },
        )
      );
    };

    [];
  };

  // Tour Management
  public type TourType = {
    #exclusiveDrop;
    #regularShow;
    #festival;
  };

  public type TourStatus = {
    #upcoming;
    #completed;
    #cancelled;
  };

  public type Tour = {
    id : Text;
    artist : Principal;
    venueName : Text;
    tourType : TourType;
    status : TourStatus;
    location : Text;
    date : Time.Time;
    ticketSales : Nat;
    ticketSalesPercentage : Float;
    merchRevenue : Nat;
  };

  public type TourSummary = {
    totalTours : Nat;
    upcomingShows : Nat;
    ticketSales : Nat;
    ticketSalesPercentage : Float;
    totalMerchRevenue : Nat;
    averageMerchPerShow : Float;
  };

  var tours = textMap.empty<Tour>();

  public query func getTours() : async [Tour] {
    // Public - tours can be viewed by anyone for discovery
    Iter.toArray(textMap.vals(tours));
  };

  public query func getArtistTours(artist : Principal) : async [Tour] {
    // Public - artist tours can be viewed by anyone for discovery
    let allTours = Iter.toArray(textMap.vals(tours));
    Iter.toArray(
      Iter.filter<Tour>(
        allTours.vals(),
        func(t : Tour) : Bool { Principal.equal(t.artist, artist) },
      )
    );
  };

  public shared ({ caller }) func addTour(tour : Tour) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can add tours");
    };
    if (not isArtist(caller) and not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Unauthorized: Only artists can add tours");
    };
    if (not Principal.equal(tour.artist, caller) and not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Unauthorized: Can only add tours for yourself");
    };
    tours := textMap.put(tours, tour.id, tour);
  };

  public shared ({ caller }) func updateTour(tour : Tour) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can update tours");
    };

    switch (textMap.get(tours, tour.id)) {
      case null Debug.trap("Tour not found");
      case (?existingTour) {
        if (not Principal.equal(existingTour.artist, caller) and not AccessControl.isAdmin(accessControlState, caller)) {
          Debug.trap("Unauthorized: Can only update your own tours");
        };
        if (not isArtist(caller) and not AccessControl.isAdmin(accessControlState, caller)) {
          Debug.trap("Unauthorized: Only artists can update tours");
        };
        tours := textMap.put(tours, tour.id, tour);
      };
    };
  };

  public shared ({ caller }) func deleteTour(tourId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can delete tours");
    };

    switch (textMap.get(tours, tourId)) {
      case null Debug.trap("Tour not found");
      case (?tour) {
        if (not Principal.equal(tour.artist, caller) and not AccessControl.isAdmin(accessControlState, caller)) {
          Debug.trap("Unauthorized: Can only delete your own tours");
        };
        if (not isArtist(caller) and not AccessControl.isAdmin(accessControlState, caller)) {
          Debug.trap("Unauthorized: Only artists can delete tours");
        };
        tours := textMap.delete(tours, tourId);
      };
    };
  };

  public query ({ caller }) func getTourSummary(artistId : Principal) : async TourSummary {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can view tour summary");
    };
    if (not Principal.equal(caller, artistId) and not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Unauthorized: Can only view your own tour summary");
    };
    if (not isArtist(caller) and not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Unauthorized: Only artists can view tour summary");
    };

    let artistTours = Iter.toArray(
      Iter.filter<Tour>(
        textMap.vals(tours),
        func(t : Tour) : Bool { Principal.equal(t.artist, artistId) },
      )
    );

    var upcomingShows = 0;
    var totalTicketSales = 0;
    var totalTicketSalesPercentage = 0.0;
    var totalMerchRevenue = 0;
    var completedShows = 0;

    for (tour in artistTours.vals()) {
      switch (tour.status) {
        case (#upcoming) upcomingShows += 1;
        case (#completed) completedShows += 1;
        case (#cancelled) {};
      };
      totalTicketSales += tour.ticketSales;
      totalTicketSalesPercentage += tour.ticketSalesPercentage;
      totalMerchRevenue += tour.merchRevenue;
    };

    let averageMerchPerShow = if (completedShows > 0) {
      Float.fromInt(totalMerchRevenue) / Float.fromInt(completedShows);
    } else {
      0.0;
    };

    let averageTicketSalesPercentage = if (artistTours.size() > 0) {
      totalTicketSalesPercentage / Float.fromInt(artistTours.size());
    } else {
      0.0;
    };

    {
      totalTours = artistTours.size();
      upcomingShows;
      ticketSales = totalTicketSales;
      ticketSalesPercentage = averageTicketSalesPercentage;
      totalMerchRevenue;
      averageMerchPerShow;
    };
  };

  public query ({ caller }) func getFilteredTours(artistId : Principal, status : ?TourStatus) : async [Tour] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only registered users can view filtered tours");
    };
    if (not Principal.equal(caller, artistId) and not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Unauthorized: Can only view your own filtered tours");
    };
    if (not isArtist(caller) and not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Unauthorized: Only artists can view filtered tours");
    };

    let artistTours = Iter.toArray(
      Iter.filter<Tour>(
        textMap.vals(tours),
        func(t : Tour) : Bool { Principal.equal(t.artist, artistId) },
      )
    );

    switch (status) {
      case null artistTours;
      case (?filterStatus) {
        Iter.toArray(
          Iter.filter<Tour>(
            artistTours.vals(),
            func(t : Tour) : Bool { t.status == filterStatus },
          )
        );
      };
    };
  };

  // Helper Functions
  func haversineDistance(lat1 : Float, lon1 : Float, lat2 : Float, lon2 : Float) : Float {
    let dLat = (lat2 - lat1) * 0.0174533;
    let dLon = (lon2 - lon1) * 0.0174533;
    let a = Float.sin(dLat / 2) ** 2 + Float.cos(lat1 * 0.0174533) * Float.cos(lat2 * 0.0174533) * Float.sin(dLon / 2) ** 2;
    let c = 2 * Float.arctan2(Float.sqrt(a), Float.sqrt(1 - a));
    6371 * c; // Earth radius in km
  };

  // User Approval System
  let approvalState = UserApproval.initState(accessControlState);

  public query ({ caller }) func isCallerApproved() : async Bool {
    AccessControl.hasPermission(accessControlState, caller, #admin) or UserApproval.isApproved(approvalState, caller);
  };

  public shared ({ caller }) func requestApproval() : async () {
    UserApproval.requestApproval(approvalState, caller);
  };

  public shared ({ caller }) func setApproval(user : Principal, status : UserApproval.ApprovalStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.setApproval(approvalState, user, status);
  };

  public query ({ caller }) func listApprovals() : async [UserApproval.UserApprovalInfo] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.listApprovals(approvalState);
  };
};
