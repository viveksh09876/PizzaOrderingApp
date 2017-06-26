import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DataService } from '../data.service';
import { UtilService } from '../util.service';

@Component({
  selector: 'app-orderreview',
  templateUrl: './orderreview.component.html',
  styleUrls: ['./orderreview.component.css']
})
export class OrderreviewComponent implements OnInit {

  items = null;
  totalCost = null;
  netCost = null;
  storeDetails = '';
  order = { 
            storeId: 1,
            user: {
                first_name: '',
                last_name: '',
                email: '',
                phone: ''
            },
            order_type: 'pickup',
            delivery_time: '',
            delivery_time_type: '',
            defer: {
              print_time: new Date().toString(),
              required_time: ''
            },
            address: {
              apartment: '',
              streetNo: '',
              street_no: '',
              street: '',
              city: '',
              state: '',
              postal_code: ''
            },
            order_details: []
          };

    validationError = {
      field: '',
      message: ''
    }

    showStep = 'step1';

  constructor(private dataService: DataService,
                private utilService: UtilService, 
                  private route: ActivatedRoute, 
                    private router: Router) { }
  
  ngOnInit() {

    this.getItems();
    this.getStoreDetails(this.order.storeId);

    let orderDetailsData = this.dataService.getLocalStorageData('order-now');
    if(orderDetailsData != null && orderDetailsData != 'null') {
      let orderDetails = JSON.parse(orderDetailsData);
      
      this.order.order_type = orderDetails.type;
      this.order.delivery_time = orderDetails.delivery_time;
      this.order.delivery_time_type = orderDetails.delivery_time_type;
      this.order.address = orderDetails.address;
      
      if(this.order.order_type == 'delivery') {
        this.totalCost += 6;
      }
    }
    
    //console.log(this.order);
  }

  getStoreDetails(storeId) {
    this.dataService.getStoreDetails(storeId)
      .subscribe(data => {              
              this.storeDetails = data;
          });
  }

  getItems() {
    
    this.items = JSON.parse(this.dataService.getLocalStorageData('allItems'));
    let tCost = this.utilService.calculateOverAllCost(this.items);
    this.totalCost = tCost
    this.netCost = tCost;
   
  }

  updateQuantity(type, plu) {

    let total = 0;

    for(var i=0; i<this.items.length; i++) {
      if(this.items[i].Product.plu_code == plu) {

          //increase
          if(type == 1) {
            this.items[i].Product.qty += 1;      
          }else{
           
            this.items[i].Product.qty = this.items[i].Product.qty - 1;
            if(this.items[i].Product.qty <= 0) {
              this.items[i].Product.qty = 1;
            }
          }

          total =  parseFloat(this.items[i].originalItemCost)*this.items[i].Product.qty;
          this.items[i].totalItemCost = total;

          break;
      }
    }

    let tCost = this.utilService.calculateOverAllCost(this.items);
    this.totalCost = tCost 
    this.netCost = tCost;
   // console.log(type, this.totalCost, this.items.Product.qty);
  }


  addDeliveryCost(e, type) {
    
    if(type == 'delivery') {
      this.totalCost = parseFloat(this.totalCost) + 6;
     
    }else{
      this.totalCost = parseFloat(this.totalCost) - 6;
    }
     
  }

  confirmOrder() {

    let isValid = this.validateFields();

    if(isValid) {
       
      //this.showStep = 'step2';
      this.placeFinalOrder();
    }else{
      alert('Please fill all required fields!');
    }
    
  }


  deleteItem(num, prod) {

    var y = confirm('Are you sure, you want to delete this item from order?');
      if(y) {
          let allItems = [];
          let item = this.items;
          for(var i=0; i<this.items.length; i++) {
            if(i != num && this.items[i].Product.plu_code != prod.Product.plu_code) {
              allItems.push(this.items[i]);
            }
          }

          if(allItems.length > 0) {
            
            this.items = allItems;
            this.dataService.setLocalStorageData('allItems', JSON.stringify(this.items));
            let tCost = this.utilService.calculateOverAllCost(allItems);
            this.totalCost = tCost
            this.netCost = tCost; 

          }else{
            this.items = [];
            this.dataService.setLocalStorageData('allItems', 'null');
            alert('No items remaining in your cart!');
            this.router.navigate(['/menu']);
          }
         
      }
      

  }


  updateDeliveryTimeType(type) {
    this.order.delivery_time_type = type;
  }

  validateFields() {

    let order = this.order;

    //No items in cart
    if(this.items.length == 0) {
      alert('No items in your cart! You will be redirected to menu page.');
      this.router.navigate(['/menu']);
    }

    return true;

  }


  placeFinalOrder() {
      let finalOrder = [];
      
      if(this.items.length > 0) {

        for(var p=0; p<this.items.length; p++) {
           let products = this.items[p];
          
           let product = { name: '', plu: '', quantity: 1, modifier: []};
            product.name = products.Product.title;
            product.plu = products.Product.plu_code;
            product.quantity = products.Product.qty;
            
            
          // console.log(products);
            if(products.ProductModifier.length > 0) {
              
              for(var i = 0; i<products.ProductModifier.length; i++) {
                
                for(var j = 0; j < products.ProductModifier[i].Modifier.ModifierOption.length; j++) {
                    
                    let opt = products.ProductModifier[i].Modifier.ModifierOption[j].Option;
                    
                    if(opt.send_code == 1) {
                      
                      let val = {
                          plu: opt.plu_code,                   
                          add_extra: opt.add_extra,
                          quantity: opt.quantity,
                          type: 0,
                          modifier_type: 'modifier'
                      }

                      if(opt.is_checked || opt.add_extra == true) {
                        val.type = 1
                      }
                      
                      product.modifier.push(val);
                    }

                }
              }

              for(var i = 0; i<products.ProductIncludedModifier.length; i++) {
                
                for(var j = 0; j < products.ProductIncludedModifier[i].option.length; j++) {
                  
                    let iopt = products.ProductIncludedModifier[i].option[j];
                                    
                      let ival = {
                          plu: iopt.plu_code,                    
                          add_extra: iopt.add_extra,
                          quantity: 1,
                          type: 0,
                          modifier_type: 'included_modifier'
                      }

                      if(iopt.send_code == 0) {
                        ival.type = 0;
                      }

                      if(iopt.add_extra == true) {
                        ival.type = 1;
                      }
                      
                      if(iopt.send_code == 1) {
                        product.modifier.push(ival);
                      }
                  
                }          
              }
              
            }
            
            finalOrder.push(product); 
        }


        let orderData = this.order;

        orderData.address.street_no = orderData.address.streetNo;
        delete orderData.address.streetNo; 

        if(this.order.order_type == 'delivery' && this.order.delivery_time_type == 'defer') {
          
          orderData.defer = {
            print_time: new Date().toString(),
            required_time: new Date(this.order.delivery_time).toString()
          }
          
          orderData.defer.print_time = this.utilService.toISOString(orderData.defer.print_time);
          orderData.defer.required_time = this.utilService.toISOString(orderData.defer.required_time);

        }else if(this.order.order_type == 'pickup') {
          delete orderData.delivery_time;
          delete orderData.delivery_time_type;
          delete orderData.address;
          delete orderData.defer;
        }

        if(this.order.delivery_time_type == 'asap') {
          delete orderData.defer;
        }

        this.order.order_details = finalOrder;
        console.log('order data:', orderData);
        this.dataService.placeOrder(orderData).subscribe(data => {
              this.dataService.setLocalStorageData('allItems', null);
               console.log(data);               
               alert('Order Placed');
               this.router.navigate(['/menu']);
            });
      
      }
      

      

  }


}