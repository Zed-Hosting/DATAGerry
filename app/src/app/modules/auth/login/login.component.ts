/*
* DATAGERRY - OpenSource Enterprise CMDB
* Copyright (C) 2024 becon GmbH
*
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as
* published by the Free Software Foundation, either version 3 of the
* License, or (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU Affero General Public License for more details.
*
* You should have received a copy of the GNU Affero General Public License
* along with this program. If not, see <https://www.gnu.org/licenses/>.
*/
import { Component, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';

import { Subscription, first } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { PermissionService } from '../services/permission.service';
import { UserSettingsDBService } from '../../../management/user-settings/services/user-settings-db.service';

import { LoginResponse } from '../models/responses';
import { Group } from 'src/app/management/models/group';
/* ------------------------------------------------------------------------------------------------------------------ */

@Component({
    selector: 'cmdb-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
    public static defaultLogoUrl: string = '/assets/img/datagerry_logo.svg';
    public static xmasLogoUrl: string = '/assets/img/datagerry_logo_xmas.svg';

    public static defaultFallItems: string = '/assets/img/nut.svg';
    public static xmasFallItems: string = '/assets/img/snowflake.svg';

    public imageUrl: string = LoginComponent.defaultLogoUrl;
    public itemUrl: string = LoginComponent.defaultFallItems;

    public loginForm: UntypedFormGroup;
    public submitted = false;

    private loginSubscription: Subscription = new Subscription();

/* -------------------------------------------------- GETTER/SETTER ------------------------------------------------- */

    get controls() {
        return this.loginForm.controls;
    }

/* --------------------------------------------------- LIFE CYCLE --------------------------------------------------- */

    constructor(
        private router: Router,
        private userSettingsDB: UserSettingsDBService,
        private authenticationService: AuthService,
        private permissionService: PermissionService,
        private render: Renderer2
    ) {
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const dateBefore = new Date(`${ year }-12-18`);
        const dateAfter = new Date(`${ year }-12-31`);

        if ((dateBefore < currentDate) && (currentDate < dateAfter)) {
            this.imageUrl = LoginComponent.xmasLogoUrl;
            this.itemUrl = LoginComponent.xmasFallItems;
        }
    }


    public ngOnInit(): void {
        this.render.addClass(document.body, 'embedded');

        this.loginForm = new UntypedFormGroup({
            username: new UntypedFormControl('', [Validators.required]),
            password: new UntypedFormControl('', [Validators.required])
        });
    }


    public ngOnDestroy(): void {
        this.render.removeClass(document.body, 'embedded');
        this.loginSubscription.unsubscribe();
    }

/* ------------------------------------------------ HELPER FUNCTIONS ------------------------------------------------ */

    public onSubmit() {
        this.submitted = true;

        let userName: string = this.loginForm.controls.username.value;
        let userPW: string = this.loginForm.controls.password.value;

        this.loginSubscription = this.authenticationService.login(userName, userPW).pipe(first())
            .subscribe({
                next: (response: LoginResponse) => {

                    this.userSettingsDB.syncSettings();

                    this.permissionService.storeUserRights(response.user.group_id).pipe(first())
                    .subscribe((group: Group) => {
                        this.router.navigate(['/']);
                    });
                },
                error: () => {
                    this.render.addClass(document.getElementById('login-logo'), 'shake');
                    this.loginForm.reset();
                    setTimeout(() => {
                        this.render.removeClass(document.getElementById('login-logo'), 'shake');
                    }, 500);
                }
            }
        );
    }
}
