import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

import { AlertService } from '../../shared/services/alert.service';

@Component({
    selector: 'app-alert', 
    templateUrl: 'alert.component.html' 
})
export class AlertComponent implements OnInit, OnDestroy {
    
    private subscription: Subscription;
    message:any;

    constructor(private alertService: AlertService) { }

    ngOnInit() {
        this.subscription = this.alertService.getAlert()
            .subscribe((message:any) => {
                switch (message && message.type) {
                    case 'success':
                        message.cssClass = 'bg-teal-100 border-teal-500 text-teal-900';
                        break;
                    case 'error':
                        message.cssClass = 'bg-red-100 border-red-500 text-red-900';
                        break;
                }

                this.message = message;
            });
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}