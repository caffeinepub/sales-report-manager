import Map "mo:core/Map";
import List "mo:core/List";
import Nat "mo:core/Nat";

module {
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

  public func run(actorState : { dailyEntries : Map.Map<Text, DailySalesEntry>; purchaseEntries : List.List<PurchaseEntry> }) : { dailyEntries : Map.Map<Text, DailySalesEntry>; purchaseEntries : List.List<PurchaseEntry> } {
    actorState;
  };
};
