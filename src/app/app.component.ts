import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

import { catchError, debounceTime, map, of, switchMap, tap } from 'rxjs';

const LS_BASE_CONFIG_KEY = 'baseConfig';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  input = new FormGroup({
    baseConfig: new FormControl('', { nonNullable: true }),
    suffix: new FormControl('', { nonNullable: true }),
  });
  output = new FormControl('', { nonNullable: true });

  constructor(private snackbar: MatSnackBar) {}

  ngOnInit(): void {
    this.input.valueChanges
      .pipe(
        map((form) => form as Required<typeof form>),
        switchMap((value) => {
          if (value.baseConfig) return of(value);
          this.output.setValue('');
          return of();
        }),
        map(({ baseConfig, ...rest }) => ({ ...rest, baseConfig: JSON.parse(baseConfig) })),
        tap(({ baseConfig }) => localStorage.setItem(LS_BASE_CONFIG_KEY, JSON.stringify(baseConfig))),
        map(({ baseConfig, suffix }) => {
          const mappedTiles = baseConfig?.tiles?.map(({ topic, topic_pub, ...rest }: any) => {
            // Replacing topic and topic_pub with its value + suffix. If the value is empty - live field empty
            return { ...rest, topic: topic ? topic + suffix : '', topic_pub: topic_pub ? topic_pub + suffix : '' };
          });
          return { ...baseConfig, tiles: mappedTiles };
        }),
        catchError((err, caught) => {
          this.output.setValue(err);
          this.output.setErrors({ errorOccurred: true });
          return caught;
        })
      )
      .subscribe((newConfig) => {
        this.output.setValue(JSON.stringify(newConfig));
      });

    this.output.markAsTouched();
    this.input.controls.baseConfig.setValue(localStorage.getItem(LS_BASE_CONFIG_KEY) || '');
  }

  copyOutput() {
    navigator.clipboard
      .writeText(this.output.getRawValue())
      .then(() => {
        this.snackbar.open('Скопировано!', 'Закрыть', { duration: 5000 });
      })
      .catch(() => {
        this.snackbar.open('Ошибка копирования', 'Ладно :(', { duration: 5000 });
      });
  }
}
