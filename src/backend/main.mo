import Map "mo:core/Map";
import List "mo:core/List";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Migration "migration";

(with migration = Migration.run)
actor {
  type DailySalesEntry = {
    date : Text;
    salesman : Text;
    loadNumber : Text;
    totalBills : Nat;
    salesValue : Float;
    daySales : Float;
    stockValue : Float;
    stockQty : Nat;
  };

  type PurchaseEntry = {
    productName : Text;
    purchaseDate : Text;
    quantity : Nat;
    purchaseRate : Float;
    totalPurchaseValue : Float;
  };

  let dailyEntries = Map.empty<Text, DailySalesEntry>();
  let purchaseEntries = List.empty<PurchaseEntry>();

  public shared ({ caller }) func saveDailyEntry(entry : DailySalesEntry) : async () {
    let key = entry.date # "_" # entry.salesman;
    dailyEntries.add(key, entry);
  };

  public query ({ caller }) func getDailyEntry(date : Text, salesman : Text) : async ?DailySalesEntry {
    let key = date # "_" # salesman;
    dailyEntries.get(key);
  };

  public query ({ caller }) func getEntriesByWeek(week : Text) : async [DailySalesEntry] {
    let filteredEntries = List.empty<DailySalesEntry>();
    for ((key, entry) in dailyEntries.entries()) {
      if (key.contains(#text week)) {
        filteredEntries.add(entry);
      };
    };
    filteredEntries.toArray();
  };

  public query ({ caller }) func getEntriesByMonth(month : Text) : async [DailySalesEntry] {
    let filteredEntries = List.empty<DailySalesEntry>();
    for ((key, entry) in dailyEntries.entries()) {
      if (key.contains(#text month)) {
        filteredEntries.add(entry);
      };
    };
    filteredEntries.toArray();
  };

  public shared ({ caller }) func addPurchase(purchase : PurchaseEntry) : async () {
    purchaseEntries.add(purchase);
  };

  public shared ({ caller }) func bulkAddPurchases(purchases : [PurchaseEntry]) : async () {
    for (purchase in purchases.values()) {
      purchaseEntries.add(purchase);
    };
  };

  public query ({ caller }) func getPurchases(date : Text) : async [PurchaseEntry] {
    let filteredPurchases = purchaseEntries.filter(
      func(p) { p.purchaseDate == date }
    );
    filteredPurchases.toArray();
  };

  public query ({ caller }) func getAllPurchases() : async [PurchaseEntry] {
    purchaseEntries.toArray();
  };
};
