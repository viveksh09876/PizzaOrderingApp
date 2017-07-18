import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DialogService } from "ng2-bootstrap-modal";
import { DataService } from '../data.service';
import { UtilService } from '../util.service';
import { OrdernowmodalComponent } from '../ordernowmodal/ordernowmodal.component';
import { LoginComponent } from '../login/login.component';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css']
})
export class AccountComponent implements OnInit {

  constructor(private dialogService:DialogService,
              private dataService: DataService,
                private utilService: UtilService,
                  private router: Router) { }
  name = '';
  currentTab = 'favItems';
  user = null;
  account = null;
  address = null;
  favItems = [];
  favOrders = [];
  storeList = [];
  prefreces = [];
  userCountryName = null;
  showLoading = false;
  currencyCode = null;
  error = { show:false, isSuccess:false, message: ''};
  errorAddress = { show:false, isSuccess:false, message: ''};
  orderData = null;
  showAddressForm = false;
  addressArr = {};
  totalNoOfAddress = null;
  option = [];
  prefrence = {
		question:[],
		subscribe:null,
    form:null,
    id:null
	};


  ngOnInit() {
    
    let isLoggedIn = this.dataService.getLocalStorageData('isLoggedIn');
    if(isLoggedIn == undefined || isLoggedIn == 'false') {
      window.location.href = '/';
      // window.location.reload();
    }else{
      this.currencyCode = this.utilService.currencyCode;
      let user = JSON.parse(this.dataService.getLocalStorageData('user-details'));
      this.user = user;
      this.name = user.firstName + ' ' + user.lastName; 
      this.getFavItems(user.id);
    } 


    this.getUserIp();

  }

  getUserIp() {
    this.dataService.getIp()
          .subscribe(data => {
              this.userCountryName = data.geoplugin_countryName;
              this.getStores(this.userCountryName);
          });
  }

  getStores(CountryName) {
    if(CountryName.length > 0) {
      this.dataService.getCountryStore(CountryName)
            .subscribe(data => {
                this.storeList = data;
            });
    }
  }

  goToTab(tab) {
    this.currentTab = tab;

    if(this.currentTab == 'favOrders') {
      this.getFavOrders(this.user.id);
    }else if(this.currentTab == 'orderHistory') {
      this.getOrderHistory(this.user.id);
    }

    if(this.currentTab == 'personalInfo') {
      this.showLoading = true;
      let userId = this.user.id;
      this.dataService.getProfile(userId).subscribe(pdata => {
        this.user = {
          id: pdata.Id,
          firstname : pdata.FirstName,
          lastname: pdata.LastName,
          email: pdata.Email,
          dob: pdata.DOB,
          postal: pdata.PostalCode,
          phone : pdata.Phone,
          favloc: pdata.FavLocation
        }
        this.error = { show:false, isSuccess:false, message: ''};
        this.showLoading = false;
      });
    }

    if(this.currentTab == 'accountInfo'){
      this.showLoading = true;
      let userId = this.user.id;
      this.dataService.getProfile(userId).subscribe(pdata => {
        this.account = {
          id: pdata.Id
        }
        this.error = { show:false, isSuccess:false, message: ''};
        this.showLoading = false;
      });
    }

    if(this.currentTab == 'preference'){
      this.dataService.getUserPrefreces()
          .subscribe(data => {
            this.prefreces = data;
      });

      this.showLoading = true;
      let userId = this.user.id;
      this.dataService.getProfile(userId).subscribe(pdata => {
        this.prefrence.subscribe = parseInt(pdata.Subscribe);
        let questionId = null;
        let answerId = null;
        let QAarr = [];
        pdata.Pref = JSON.parse(pdata.Pref);
        for (var key in pdata.Pref) {
            if(pdata.Pref.hasOwnProperty(key)){ 
              for(var i=0; i<pdata.Pref[key].length; i++){
                answerId = pdata.Pref[key][i];
              }
              QAarr[key] = {'questionId':key,'answerId':answerId};
            }          
        }
        this.prefrence.question.push(QAarr);
        this.error = { show:false, isSuccess:false, message: ''};
        this.showLoading = false;
      });
    }

    if(this.currentTab == 'address'){
      this.totalNoOfAddress = 0;
      this.showLoading = true;
      this.showAddressForm = false;
      let userId = this.user.id;
      this.dataService.getProfile(userId).subscribe(pdata => {
        this.addressArr = {
          address1 :(pdata.Address1!='')?JSON.parse(pdata.Address1):'',
          address2 :(pdata.Address2!='')?JSON.parse(pdata.Address2):'',
          address3 :(pdata.Address3!='')?JSON.parse(pdata.Address3):'',
        };
        for (var key in this.addressArr) {
          if(this.addressArr.hasOwnProperty(key) && this.addressArr[key]!=''){
            this.totalNoOfAddress++;
          }
        }
        this.error = { show:false, isSuccess:false, message: ''};
        this.showLoading = false;
      });
    }
  }

  updateProfile(){
    this.showLoading = true;
    // let userId = this.user.id;
    this.user.form = 1;
    this.user.dob = String (this.user.dob);
    this.dataService.updateProfile(this.user).subscribe(data => {
      if(data.isSuccess) {
        this.error = data;
        // this.dataService.getProfile(userId).subscribe(pdata => {
        //   let user = {
        //       id: pdata.Id,
        //       FirstName : pdata.FirstName,
        //       LastName: pdata.LastName,
        //       email: pdata.Email
        //   }
        //   this.dataService.setLocalStorageData('user-details', JSON.stringify(user));
        // });
      }else{
        this.error = data;
      }
      this.showLoading = false;
    });
  }

  updateAccount(){
    this.showLoading = true;
    this.account.form = 2;
    this.dataService.updateProfile(this.account).subscribe(data => {
     if(data.isSuccess) {
        this.error = data;
      }else{
        this.error = data;
      }
      this.showLoading = false;
    });
  }

  setAnswer(questionId,answerId){
		let QAarr = [];
		QAarr[questionId] = {'questionId':questionId,'answerId':answerId};
		this.prefrence.question.push(QAarr);
  }
  
  updatePrefrence(){
    this.showLoading = true;
    this.prefrence.form = 3;
    this.prefrence.id = this.user.id;
    console.log(this.prefrence);
    this.dataService.updatePrefrence(this.prefrence).subscribe(data => {
     if(data.isSuccess) {
        this.error = data;
      }else{
        this.error = data;
      }
      this.showLoading = false;
    });
  }

  showAddAddressForm(){
    this.showLoading = true;
    this.errorAddress = { show:false, isSuccess:false, message: ''};
    this.address = {
        address_type: 'Home',
        is_default:0,
        firstname : '',
        lastname: '',
        apartment:'',
        streetNo:'',
        street:'',
        city:'',
        state:'',
        postal_code:'',
    }
    this.showAddressForm = !this.showAddressForm;
    this.showLoading = false;
  }

  addAddress(){
    this.showLoading = true;
    this.address.id = this.user.id;
    this.address.is_default = (this.address.is_default)?1:0;
    if(this.address.addressNo!=null){
      this.dataService.editAddress(this.address)
        .subscribe(data => {
          if(data.isSuccess) {
            this.errorAddress = data;
              setTimeout(()=>{ 
                  this.goToTab('address');
              },3000);
              
          }else{
            this.errorAddress = data;
          }
        }); 
    }else{
      this.dataService.addAddress(this.address)
        .subscribe(data => {
          if(data.isSuccess) {
            this.errorAddress = data;
              setTimeout(()=>{ 
                  this.goToTab('address');
              },3000);
              
          }else{
            this.errorAddress = data;
          }
        }); 
    }
    this.showLoading = false;
  }

  editAddress(addressNo){
    this.showAddressForm = true;
    this.errorAddress = { show:false, isSuccess:false, message: ''};
    this.showLoading = true;
    let userId = this.user.id;
    this.dataService.getProfile(userId).subscribe(pdata => {
      if(addressNo=='Address1'){
         this.address = {
            address_type: JSON.parse(pdata.Address1).address_type,
            is_default:JSON.parse(pdata.Address1).is_default,
            firstname : JSON.parse(pdata.Address1).firstname,
            lastname: JSON.parse(pdata.Address1).lastname,
            apartment:JSON.parse(pdata.Address1).apartment,
            streetNo:JSON.parse(pdata.Address1).streetNo,
            street:JSON.parse(pdata.Address1).street,
            city:JSON.parse(pdata.Address1).city,
            state:JSON.parse(pdata.Address1).state,
            postal_code:JSON.parse(pdata.Address1).postal_code,
            phone:JSON.parse(pdata.Address1).phone,
            addressNo:'Address1',
        }
      }else if(addressNo=='Address2'){
         this.address = {
            address_type: JSON.parse(pdata.Address2).address_type,
            is_default:JSON.parse(pdata.Address2).is_default,
            firstname : JSON.parse(pdata.Address2).firstname,
            lastname: JSON.parse(pdata.Address2).lastname,
            apartment:JSON.parse(pdata.Address2).apartment,
            streetNo:JSON.parse(pdata.Address2).streetNo,
            street:JSON.parse(pdata.Address2).street,
            city:JSON.parse(pdata.Address2).city,
            state:JSON.parse(pdata.Address2).state,
            postal_code:JSON.parse(pdata.Address2).postal_code,
            phone:JSON.parse(pdata.Address2).phone,
            addressNo:'Address2',
        }
      }else{
        this.address = {
            address_type: JSON.parse(pdata.Address3).address_type,
            is_default:JSON.parse(pdata.Address3).is_default,
            firstname : JSON.parse(pdata.Address3).firstname,
            lastname: JSON.parse(pdata.Address3).lastname,
            apartment:JSON.parse(pdata.Address3).apartment,
            streetNo:JSON.parse(pdata.Address3).streetNo,
            street:JSON.parse(pdata.Address3).street,
            city:JSON.parse(pdata.Address3).city,
            state:JSON.parse(pdata.Address3).state,
            postal_code:JSON.parse(pdata.Address3).postal_code,
            phone:JSON.parse(pdata.Address3).phone,
            addressNo:'Address3',
        }
      }
      this.showLoading = false;
    });
  }

  deleteAddress(addressNo){
    if(confirm('Are you sure want to remove address?')){
      this.showLoading = true;
      let userId = this.user.id;
      if(addressNo=='Address1'){
          this.address = {
            addressNo:'Address1',
            id:userId
        }
      }else if(addressNo=='Address2'){
          this.address = {
            addressNo:'Address2',
            id:userId
        }
      }else{
        this.address = {
            addressNo:'Address3',
            id:userId
        }
      }
      this.dataService.deleteAddress(this.address)
          .subscribe(data => {
            if(data.isSuccess) {
              this.errorAddress = data;
                setTimeout(()=>{ 
                    this.goToTab('address');
                },3000);
                
            }else{
              this.errorAddress = data;
            }
          }); 
      this.showLoading = false;
    }
  }

  setAsDefault(addressNo){
    this.showLoading = true;
    let userId = this.user.id;
    if(addressNo=='Address1'){
        this.address = {
          addressNo:'Address1',
          id:userId
      }
    }else if(addressNo=='Address2'){
        this.address = {
          addressNo:'Address2',
          id:userId
      }
    }else{
      this.address = {
          addressNo:'Address3',
          id:userId
      }
    }
    this.dataService.setAsDefault(this.address)
        .subscribe(data => {
          if(data.isSuccess) {
            this.errorAddress = data;
              setTimeout(()=>{ 
                  this.goToTab('address');
              },3000);
              
          }else{
            this.errorAddress = data;
          }
        }); 
    this.showLoading = false;
  }

  getOrderHistory(userId) {
    this.showLoading = true;
    this.dataService.getOrderHistory(userId)
        .subscribe(data => {
          if(data != 'null' && data != null && data.length > 0) {
            this.orderData = data;
            this.showLoading = false;
          }

        }); 
        this.showLoading = false;
  }
 
  getFavItems(userId) {
    this.showLoading = true;
    this.dataService.getFav('item', userId)
        .subscribe(data => {
          if(data != 'null' && data != null) {
            this.favItems = data;

            if(this.favItems.length > 0) {
              for(var i=0; i<this.favItems.length; i++) {
                this.favItems[i].FDetail = JSON.parse(this.favItems[i].FDetail);
              }
            }
            this.showLoading = false;
          }

        });  
  }

  getFavOrders(userId) {
    this.showLoading = true;
    this.dataService.getFav('order', userId)
        .subscribe(data => {
            if(data != 'null' && data != null) {
              
              this.favOrders = data;
              if(this.favOrders.length > 0) {
                for(var i=0; i<this.favOrders.length; i++) {    
                  this.favOrders[i].FDetail = JSON.parse(this.favOrders[i].FDetail);
                  //console.log(this.favOrders[i].FDetail)
                }
              }
            }
            this.showLoading = false;
        });  
  }  


  orderFavItem(itemData) {
    this.dataService.setLocalStorageData('favItemFetched', JSON.stringify(itemData));
    this.router.navigate(['/item','favorite']);    
  }

  orderFavOrder(itemData) {
    this.showLoading = true;
    this.dataService.setLocalStorageData('favOrdersFetched', JSON.stringify(itemData));
    let menuCountry = 'UAE';
    if(this.dataService.getLocalStorageData('menuCountry') != null && 
            this.dataService.getLocalStorageData('menuCountry') != undefined) {
          menuCountry = this.dataService.getLocalStorageData('menuCountry');    
    }

    this.dataService.getFavOrderData(itemData, menuCountry)
          .subscribe(data => {
            this.dataService.setLocalStorageData('allItems', JSON.stringify(data));
            this.showLoading = false;
            this.router.navigate(['/order-review']);  
        });  
    //  
  }  


  openModal(type) {     
      let isLoggedIn = this.dataService.getLocalStorageData('isLoggedIn');
      if(isLoggedIn == undefined || isLoggedIn == 'false') {
         this.dialogService.addDialog(LoginComponent, {  }, { closeByClickingOutside:true });
      }else{
        this.dialogService.addDialog(OrdernowmodalComponent, {  }, { closeByClickingOutside:true }); 
      }
                
  }



}
