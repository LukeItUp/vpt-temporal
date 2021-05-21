// #package js/main

// #include AbstractDialog.js

// #include ../../uispecs/TemporalLoadDialog.json

class TemporalLoadDialog extends AbstractDialog {

    constructor(options) {
        super(UISPECS.TemporalLoadDialog, options);
    
        this._handleTypeChange = this._handleTypeChange.bind(this);
        this._handleLoadClick = this._handleLoadClick.bind(this);
        this._handleFileChange = this._handleFileChange.bind(this);
        this._handleURLChange = this._handleURLChange.bind(this);
        this._handleDemoChange = this._handleDemoChange.bind(this);
        this._handlePlayButton = this._handlePlayButton.bind(this);
        this._handlePrevButton = this._handlePrevButton.bind(this);
        this._handleNextButton = this._handleNextButton.bind(this);
        
        this._handleTemporalSelect = this._handleTemporalSelect.bind(this);
        this._setTimeTemporal = this._setTimeTemporal.bind(this);
        this._setErrorTemporal = this._setErrorTemporal.bind(this);
        this._checkRMSE = this._checkRMSE.bind(this);

        this._incrementTemporalVolume = this._incrementTemporalVolume.bind(this);
        this._updateTemporalValue = this._updateTemporalValue.bind(this);
        this._handleFrameSpinner = this._handleFrameSpinner.bind(this);
        this._handleFrameSlider = this._handleFrameSlider.bind(this);

        this._demos = [];
    
        this._addEventListeners();
        this._loadDemoJson();
    }
    
    _addEventListeners() {
        this._binds.type.addEventListener('change', this._handleTypeChange);
        this._binds.loadButton.addEventListener('click', this._handleLoadClick);
        this._binds.file.addEventListener('change', this._handleFileChange);
        this._binds.url.addEventListener('input', this._handleURLChange);
        this._binds.demo.addEventListener('change', this._handleDemoChange);
        this._binds.playButton.addEventListener('click', this._handlePlayButton);
        this._binds.prevButton.addEventListener('click', this._handlePrevButton);
        this._binds.nextButton.addEventListener('click', this._handleNextButton);
        this._binds.temporalSelect.addEventListener('change', this._handleTemporalSelect);
        this._binds.temporalValueSpinner.addEventListener('change', this._updateTemporalValue);
        this._binds.frameSpinner.addEventListener('change', this._handleFrameSpinner);
        this._binds.frameSlider.addEventListener('change', this._handleFrameSlider);
    
    }

    _handleTemporalSelect() {
        var label = this._binds.temporalSelect.getValue();
        switch (label) {
            case 'timeSpinner':
                this._setTimeTemporal();
                document.temporal_play = false;
                this._updatePlayButtonLabel();
                window.clearInterval(document.temporal_time_interval);
                break;
            case 'errorSpinner':
                this._setErrorTemporal();
                document.temporal_play = false;
                this._updatePlayButtonLabel();
                window.clearInterval(document.temporal_time_interval);
                break;
        }
        
    }

    _setTimeTemporal() {
        document.temporal_type = 'time';
        this._binds.temporalValueLabel.setLabel("Time interval:")
        this._binds.temporalValueSpinner.setMin(500);
        this._binds.temporalValueSpinner.setMax(10000);
        this._binds.temporalValueSpinner.setStep(1000);
        this._binds.temporalValueSpinner.setValue(1000);
        document.temporal_value = 1000;
    }
    
    _setErrorTemporal() {
        document.temporal_type = 'rmse';
        this._binds.temporalValueLabel.setLabel("RMSE threshold:")
        this._binds.temporalValueSpinner.setMin(0);
        this._binds.temporalValueSpinner.setMax(5);
        this._binds.temporalValueSpinner.setStep(0.1);
        this._binds.temporalValueSpinner.setValue(0.3);
        document.temporal_value = 0.3;
    }

    _handlePlayButton() {
        // don't do anything if file hasn't been loaded
        if (!document.file_options) {
            return;
        }
        switch (document.temporal_type) {
            case 'time':
                if (document.temporal_play) {   // stop playing and clear inverval
                    document.temporal_play = false;
                    this._updatePlayButtonLabel();
                    window.clearInterval(document.temporal_time_interval);
                } else {                        // start playing and set inverval
                    document.temporal_play = true;
                    this._updatePlayButtonLabel();
                    document.temporal_time_interval = window.setInterval(this._incrementTemporalVolume, document.temporal_value);
                }
                break;
            case 'rmse':
                if (document.temporal_play) {   // stop playing and clear inverval
                    document.temporal_play = false;
                    this._updatePlayButtonLabel();
                    window.clearInterval(document.temporal_time_interval);
                } else {                        // start playing and set inverval
                    document.temporal_play = true;
                    document.rmse_go = true;  // so we continue to the next frame since this one is probably already below rmse treshold
                    this._updatePlayButtonLabel();
                    document.temporal_time_interval = window.setInterval(this._checkRMSE, 100);
                }
                break;
        }
    }

    _checkRMSE() {
        if (isNaN(document.current_rmse) || document.current_rmse <= document.temporal_value || document.rmse_go) {
            console.log("Current RMSE:", document.current_rmse);
            document.rmse_go = false;
            this._incrementTemporalVolume();
        }
    }

    _updateTemporalValue() {
        document.temporal_value = this._binds.temporalValueSpinner.getValue();
        console.log(document.time_interval);
        if (document.temporal_play && document.temporal_type == 'time') {
            window.clearInterval(document.temporal_time_interval);
            document.temporal_time_interval = window.setInterval(this._incrementTemporalVolume, document.temporal_value);
        } else if (document.temporal_play && document.temporal_type == 'rmse') {
            window.clearInterval(document.temporal_time_interval);
            document.rmse_go = true;
            document.temporal_time_interval = window.setInterval(this._checkRMSE, 100);
            
        }
    }

    _updatePlayButtonLabel() {
        if (document.temporal_play) {
            this._binds.playButton.setLabel("⏸︎");
        } else {
            this._binds.playButton.setLabel("⏯")
        }
    }

    _incrementTemporalVolume() {
        if (document.temporal_frame + 1 == document.max_temporal_frame) {
            document.temporal_frame = 0;
        } else {
            document.temporal_frame += 1;
        }
        this._updateFrameSpinner();
        this._updateFrameSlider();
        this.trigger('load', document.file_options);
        document.time_measure = performance.now();
    }

    _handlePrevButton() {
        // don't do anything if file hasn't been loaded
        if (!document.file_options) {
            return;
        }
        // stop play function
        if (document.temporal_play) {
            document.temporal_play = false;
            this._updatePlayButtonLabel();
            window.clearInterval(document.temporal_time_interval);
        }
        if (document.temporal_frame != 0) {
            document.temporal_frame -= 1;
            this._updateFrameSpinner();
            this._updateFrameSlider();
            this.trigger('load', document.file_options);
        }
    }

    _handleNextButton() {
        // don't do anything if file hasn't been loaded
        if (!document.file_options) {
            return;
        }
        // stop play function
        if (document.temporal_play) {
            document.temporal_play = false;
            this._updatePlayButtonLabel();
            window.clearInterval(document.temporal_time_interval);
        }
        if (document.temporal_frame + 1 < document.max_temporal_frame) {
            document.temporal_frame += 1;
            this._updateFrameSpinner();
            this._updateFrameSlider();
            this.trigger('load', document.file_options);
        }
    }

    _updateFrameSlider() {
        this._binds.frameSlider.setValue2(document.temporal_frame, document.max_temporal_frame - 1);
    }

    _handleFrameSlider() {
        // don't do anything if file hasn't been loaded
        if (!document.file_options) {
            return;
        }
        document.temporal_frame = Math.floor(this._binds.frameSlider.getValue());
        this._updateFrameSpinner();
        this._updateFrameSlider();
        //this._updateFrameSlider();
        // stop play function
        if (document.temporal_play) {
            document.temporal_play = false;
            window.clearInterval(document.temporal_time_interval);
            this._updatePlayButtonLabel();
        }
        this.trigger('load', document.file_options);
    }

    _updateFrameSpinner() {
        this._binds.frameSpinner.setMax(document.max_temporal_frame - 1);
        this._binds.frameSpinner.setValue(document.temporal_frame);
    }

    _handleFrameSpinner() {
        // don't do anything if file hasn't been loaded
        if (!document.file_options) {
            return;
        }
        document.temporal_frame = this._binds.frameSpinner.getValue();
        this._updateFrameSlider();
        this._updateFrameSpinner();
        // stop play function
        if (document.temporal_play) {
            document.temporal_play = false;
            window.clearInterval(document.temporal_time_interval);
            this._updatePlayButtonLabel();
        }
        this.trigger('load', document.file_options);
    }

    _loadDemoJson() {
        const xhr = new XMLHttpRequest();
        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                this._demos = JSON.parse(xhr.responseText);
                this._demos.forEach(demo => {
                    this._binds.demo.addOption(demo.value, demo.label);
                });
            }
        });
        xhr.open('GET', 'demo-volumes.json');
        xhr.send();
    }
    
    _getVolumeTypeFromURL(filename) {
        const exn = filename.split('.').pop().toLowerCase();
        const exnToType = {
            'bvp'  : 'bvp',
            'json' : 'json',
            'zip'  : 'zip',
        };
        return exnToType[exn] || 'raw';
    }
    
    _handleLoadClick() {
        document.reader = false;
        switch (this._binds.type.getValue()) {
            case 'file' : this._handleLoadFile(); break;
            case 'url'  : this._handleLoadURL();  break;
            case 'demo' : this._handleLoadDemo(); break;
        }
    }
    
    _handleLoadFile() {
        const files = this._binds.file.getFiles();
        if (files.length === 0) {
            // update status bar?
            return;
        }
    
        const file = files[0];
        const filetype = this._getVolumeTypeFromURL(file.name);
        const dimensions = this._binds.dimensions.getValue();
        const precision = parseInt(this._binds.precision.getValue(), 10);
    
        document.file_options = {
            type       : 'file',
            file       : file,
            filetype   : filetype,
            dimensions : dimensions,
            precision  : precision,
        };
        document.temporal_flag = true;
        this.trigger('load', document.file_options);
    }
    
    _handleLoadURL() {
        const url = this._binds.url.getValue();
        const filetype = this._getVolumeTypeFromURL(url);
        this.trigger('load', {
            type     : 'url',
            url      : url,
            filetype : filetype
        });
    }
    
    _handleLoadDemo() {
        const demo = this._binds.demo.getValue();
        const found = this._demos.find(d => d.value === demo);
        const filetype = this._getVolumeTypeFromURL(found.url);
        this.trigger('load', {
            type     : 'url',
            url      : found.url,
            filetype : filetype
        });
    }
    
    _handleTypeChange() {
        // TODO: switching panel
        switch (this._binds.type.getValue()) {
            case 'file':
                this._binds.filePanel.show();
                this._binds.urlPanel.hide();
                this._binds.demoPanel.hide();
                break;
            case 'url':
                this._binds.filePanel.hide();
                this._binds.urlPanel.show();
                this._binds.demoPanel.hide();
                break;
            case 'demo':
                this._binds.filePanel.hide();
                this._binds.urlPanel.hide();
                this._binds.demoPanel.show();
                break;
        }
        this._updateLoadButtonAndProgressVisibility();
    }
    
    _handleFileChange() {
        const files = this._binds.file.getFiles();
        if (files.length === 0) {
            this._binds.rawSettingsPanel.hide();
        } else {
            const file = files[0];
            const type = this._getVolumeTypeFromURL(file.name);
            this._binds.rawSettingsPanel.setVisible(type === 'raw');
        }
        this._updateLoadButtonAndProgressVisibility();
    }
    
    _handleURLChange() {
        this._updateLoadButtonAndProgressVisibility();
    }
    
    _handleDemoChange() {
        this._updateLoadButtonAndProgressVisibility();
    }
    
    _updateLoadButtonAndProgressVisibility() {
        switch (this._binds.type.getValue()) {
            case 'file':
                const files = this._binds.file.getFiles();
                this._binds.loadButtonAndProgress.setVisible(files.length > 0);
                break;
            case 'url':
                const urlEmpty = this._binds.url.getValue() === '';
                this._binds.loadButtonAndProgress.setVisible(!urlEmpty);
                break;
            case 'demo':
                const demo = this._binds.demo.getValue();
                this._binds.loadButtonAndProgress.setVisible(!!demo);
                break;
        }
    }
    
    }
    